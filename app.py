import math, re, json
from collections import Counter
from dataclasses import dataclass
@dataclass(frozen=True)
class Document:
    id: str
    tenant: str
    text: str

def tokens(text):
    return re.findall(r"[a-z0-9]+", text.lower())

class Search:
    def __init__(self, documents):
        self.documents = list(documents)
        if len({d.id for d in self.documents}) != len(self.documents):
            raise ValueError('Document IDs must be unique')

    def query(self, text, tenant, k=3):
        if not tenant or k < 1:
            raise ValueError('Tenant and positive k required')
        # Compute statistics within the authorized tenant: no cross-tenant IDF leakage.
        docs = [d for d in self.documents if d.tenant == tenant]
        terms = set(tokens(text))
        if not docs or not terms: return []
        bags = [Counter(tokens(d.text)) for d in docs]
        avg = sum(sum(b.values()) for b in bags) / len(bags)
        if not avg: return []
        df = Counter(t for b in bags for t in b)
        ranked = []
        for d,b in zip(docs,bags):
            score = 0.0
            for term in terms:
                frequency = b[term]
                if not frequency: continue
                idf = math.log(1 + (len(docs)-df[term]+0.5)/(df[term]+0.5))
                score += idf * frequency * 2.2 / (frequency + 1.2*(0.25+0.75*sum(b.values())/avg))
            if score > 0: ranked.append({'citation':d.id,'excerpt':d.text,'score':round(score,6)})
        return sorted(ranked,key=lambda r:(-r['score'],r['citation']))[:k]

    def answer(self,text,tenant):
        hits=self.query(text,tenant)
        return {'status':'evidence_found' if hits else 'abstain','evidence':hits,
                'note':'Extractive evidence only; no generated or verified answer.'}

def evaluate(engine,cases,k=3):
    if not cases: raise ValueError('Cases required')
    reciprocal=[]; recalls=[]
    for case in cases:
        ids=[h['citation'] for h in engine.query(case['query'],case['tenant'],k)]
        expected=set(case['relevant'])
        if not expected: raise ValueError('Relevant labels required')
        reciprocal.append(next((1/(i+1) for i,x in enumerate(ids) if x in expected),0))
        recalls.append(len(set(ids)&expected)/len(expected))
    return {'mrr':sum(reciprocal)/len(cases),'recall_at_k':sum(recalls)/len(cases),'cases':len(cases)}

if __name__=='__main__':
    engine=Search([Document('returns','shop','Returns accepted within thirty days with receipt.'),Document('shipping','shop','Standard shipping takes five business days.'),Document('private','other','Private account billing instructions.')])
    cases=[{'query':'returns receipt','tenant':'shop','relevant':['returns']},{'query':'shipping','tenant':'shop','relevant':['shipping']}]
    print(json.dumps({'result':engine.answer('returns receipt','shop'),'evaluation':evaluate(engine,cases)},indent=2))
