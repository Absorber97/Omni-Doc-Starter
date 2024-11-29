import { PDFDocument, PDFPageContent } from '@/lib/types/pdf';

export class LocalVectorStore {
  private readonly storeName = 'vectors';
  private readonly dbName = 'VectorStore';
  private readonly version = 1;

  async storeVectors(document: PDFDocument, pageVectors: { [pageNumber: number]: number[] }) {
    const db = await this.openDB();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);

    const vectorIds: string[] = [];

    for (const [pageNumber, vector] of Object.entries(pageVectors)) {
      const vectorId = `${document.id}_page_${pageNumber}`;
      await store.put({
        id: vectorId,
        documentId: document.id,
        pageNumber: parseInt(pageNumber),
        vector,
        text: document.pages[parseInt(pageNumber) - 1].text,
      });
      vectorIds.push(vectorId);
    }

    return vectorIds;
  }

  async search(query: number[], limit: number = 5): Promise<Array<{
    documentId: string;
    pageNumber: number;
    text: string;
    similarity: number;
  }>> {
    const db = await this.openDB();
    const tx = db.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const vectors = await store.getAll();

    return vectors
      .map(item => ({
        documentId: item.documentId,
        pageNumber: item.pageNumber,
        text: item.text,
        similarity: this.cosineSimilarity(query, item.vector),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
} 