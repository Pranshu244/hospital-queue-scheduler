class MinHeap:
    def __init__(self):
        self.heap=[]
    def parent(self,i):
        return (i-1)//2
    def left(self, i):
        return 2*i+1
    def right(self,i):
        return 2*i+2
    def insert(self,item):
        self.heap.append(item)
        i=len(self.heap)-1
        while i>0 and self.heap[i][0]<self.heap[self.parent(i)][0]:
            p=self.parent(i)
            self.heap[i],self.heap[p]=self.heap[p],self.heap[i]
            i=p
    def heapify(self,i):
        smallest=i
        l=self.left(i)
        r=self.right(i)
        n=len(self.heap)
        if l<n and self.heap[l][0]<self.heap[smallest][0]:
            smallest=l
        if r<n and self.heap[r][0]<self.heap[smallest][0]:
            smallest=r
        if smallest!=i:
            self.heap[i],self.heap[smallest]=self.heap[smallest],self.heap[i]
            self.heapify(smallest)
    def extract_min(self):
        if not self.heap:
            return None
        if len(self.heap)==1:
            return self.heap.pop()
        root=self.heap[0]
        self.heap[0]=self.heap.pop()
        self.heapify(0)
        return root
    def peek(self):
        if not self.heap:
            return None
        return self.heap[0]
    def is_empty(self):
        return len(self.heap)==0
    def size(self):
        return len(self.heap)
    def build_heap(self, items):
        self.heap=items[:]
        for i in range(len(self.heap)// 2 - 1, -1, -1):
            self.heapify(i)