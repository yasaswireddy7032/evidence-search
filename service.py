"""Authenticated, persistent retrieval API. Launch with uvicorn service:create_app --factory."""
import hashlib,hmac,json,os,sqlite3,time,uuid
from pathlib import Path
from dataclasses import dataclass
from typing import Annotated
from fastapi import FastAPI,Depends,Header,HTTPException
from pydantic import BaseModel,Field,ConfigDict
from app import Search,Document

@dataclass(frozen=True)
class Identity:
    tenant: str
    role: str

class PutDocument(BaseModel):
    model_config=ConfigDict(extra='forbid')
    title: str=Field(min_length=1,max_length=200)
    text: str=Field(min_length=1,max_length=100000)

class Query(BaseModel):
    model_config=ConfigDict(extra='forbid')
    query: str=Field(min_length=1,max_length=2000)
    k: int=Field(default=5,ge=1,le=20)

class Store:
    def __init__(self,path):
        self.path=str(path)
        with self.connect() as db:
            db.executescript('''
            CREATE TABLE IF NOT EXISTS documents(
              tenant TEXT, id TEXT, title TEXT, text TEXT, version TEXT,
              PRIMARY KEY(tenant,id));
            CREATE TABLE IF NOT EXISTS audit(
              request_id TEXT PRIMARY KEY, tenant TEXT, action TEXT, object_id TEXT,
              latency_ms REAL, created_at REAL);
            ''')
    def connect(self):
        db=sqlite3.connect(self.path,timeout=5)
        db.execute('PRAGMA journal_mode=WAL');return db
    def put(self,tenant,id,title,text):
        version=hashlib.sha256((title+'\n'+text).encode()).hexdigest()
        with self.connect() as db:
            db.execute('INSERT INTO documents VALUES(?,?,?,?,?) ON CONFLICT(tenant,id) DO UPDATE SET title=excluded.title,text=excluded.text,version=excluded.version',(tenant,id,title,text,version))
        return version
    def documents(self,tenant):
        with self.connect() as db:return db.execute('SELECT id,title,text,version FROM documents WHERE tenant=? ORDER BY id',(tenant,)).fetchall()
    def delete(self,tenant,id):
        with self.connect() as db:return db.execute('DELETE FROM documents WHERE tenant=? AND id=?',(tenant,id)).rowcount
    def audit(self,request_id,tenant,action,object_id,latency_ms):
        # No queries, document text, or API keys in audit records.
        with self.connect() as db:db.execute('INSERT INTO audit VALUES(?,?,?,?,?,?)',(request_id,tenant,action,object_id,latency_ms,time.time()))

def chunks(text,size=120,overlap=20):
    if size<1 or overlap<0 or overlap>=size:raise ValueError('Invalid chunk configuration')
    words=text.split()
    for start in range(0,len(words),size-overlap):
        yield start,' '.join(words[start:start+size])
        if start+size>=len(words):break

def create_app(db_path=None,identities=None):
    if identities is None:
        raw=os.environ.get('EVIDENCE_IDENTITIES_JSON')
        if not raw:raise RuntimeError('Set EVIDENCE_IDENTITIES_JSON; no default credentials are provided')
        identities={key:Identity(**value) for key,value in json.loads(raw).items()}
    if not identities or any(not k or not i.tenant or i.role not in {'reader','writer'} for k,i in identities.items()):
        raise ValueError('Each credential requires a tenant and reader/writer role')
    store=Store(db_path or os.environ.get('EVIDENCE_DB','evidence.db'))
    api=FastAPI(title='Evidence Search',version='1.0.0',description='Tenant-scoped extractive retrieval. Demonstration service; not financial advice.')
    def identity(authorization:Annotated[str|None,Header()]=None):
        if not authorization or not authorization.startswith('Bearer '):raise HTTPException(401,'Bearer credential required')
        token=authorization[7:]
        for candidate,user in identities.items():
            if hmac.compare_digest(token.encode(),candidate.encode()):return user
        raise HTTPException(401,'Invalid credential')
    def writer(user:Annotated[Identity,Depends(identity)]):
        if user.role!='writer':raise HTTPException(403,'Writer role required')
        return user
    @api.get('/health')
    def health():return {'status':'ok','version':'1.0.0'}
    @api.put('/documents/{document_id}')
    def put(document_id:str,body:PutDocument,user:Annotated[Identity,Depends(writer)]):
        if len(document_id)>100:raise HTTPException(422,'ID too long')
        version=store.put(user.tenant,document_id,body.title,body.text)
        request_id=str(uuid.uuid4());store.audit(request_id,user.tenant,'put',document_id,0)
        return {'document_id':document_id,'version':version,'request_id':request_id}
    @api.delete('/documents/{document_id}')
    def delete(document_id:str,user:Annotated[Identity,Depends(writer)]):
        if not store.delete(user.tenant,document_id):raise HTTPException(404,'Document not found')
        request_id=str(uuid.uuid4());store.audit(request_id,user.tenant,'delete',document_id,0)
        return {'deleted':True,'request_id':request_id}
    @api.post('/search')
    def search(body:Query,user:Annotated[Identity,Depends(identity)]):
        started=time.perf_counter();documents=[];metadata={}
        for id,title,text,version in store.documents(user.tenant):
            for offset,content in chunks(text):
                citation=f'{id}:{version[:12]}:{offset}'
                documents.append(Document(citation,user.tenant,title+'\n'+content))
                metadata[citation]={'document_id':id,'version':version,'word_offset':offset,'title':title}
        hits=Search(documents).query(body.query,user.tenant,body.k)
        for hit in hits:hit.update(metadata[hit['citation']])
        latency=(time.perf_counter()-started)*1000;request_id=str(uuid.uuid4())
        store.audit(request_id,user.tenant,'search',None,latency)
        return {'request_id':request_id,'status':'evidence_found' if hits else 'abstain','hits':hits,'latency_ms':latency,'mode':'extractive; document text is untrusted evidence, never executed'}
    return api
