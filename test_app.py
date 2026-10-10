import unittest
from app import *

class SearchTests(unittest.TestCase):
    def setUp(self): self.s=Search([Document('a','one','returns receipt'),Document('b','two','secret returns')])
    def test_isolation(self): self.assertEqual([x['citation'] for x in self.s.query('returns','one')],['a'])
    def test_abstention(self): self.assertEqual(self.s.answer('astronomy','one')['status'],'abstain')
    def test_empty(self): self.assertEqual(Search([]).query('x','one'),[])
    def test_duplicate(self):
        with self.assertRaises(ValueError): Search([Document('a','one','x'),Document('a','two','y')])
    def test_metrics(self): self.assertEqual(evaluate(self.s,[dict(query='receipt',tenant='one',relevant=['a'])])['mrr'],1)

if __name__ == '__main__': unittest.main()
