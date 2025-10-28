const DB_NAME = 'ConstructTrackProDB';
const STORE_NAME = 'photos';
let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // If db is already initialized, resolve it
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME);
      }
    };
  });
};

const getDB = async (): Promise<IDBDatabase> => {
    if (db) return db;
    return await initDB();
}

export const setPhoto = (projectId: number, photoId: number, imageDataUrl: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB();
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(imageDataUrl, `${projectId}-${photoId}`);

            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.error('Error saving photo:', request.error);
                reject(request.error);
            };
        } catch (error) {
            reject(error);
        }
    });
};

export const getPhoto = (projectId: number, photoId: number): Promise<string | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB();
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(`${projectId}-${photoId}`);

            request.onsuccess = () => {
                resolve(request.result ? request.result : null);
            };
            request.onerror = () => {
                console.error('Error getting photo:', request.error);
                reject(request.error);
            };
        } catch (error) {
            reject(error);
        }
    });
};

export const getPhotosForProject = (
    projectId: number, 
    photoMetas: { id: number; description: string; dateAdded: Date }[]
): Promise<{ id: number; url: string; description: string; dateAdded: Date; }[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB();
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const photoPromises = photoMetas.map(meta => {
                return new Promise((resolvePhoto, rejectPhoto) => {
                    const request = store.get(`${projectId}-${meta.id}`);
                    request.onsuccess = () => {
                        if (request.result) {
                            resolvePhoto({ ...meta, url: request.result });
                        } else {
                            // Resolve with null if a specific photo is not found
                            resolvePhoto(null); 
                        }
                    };
                    request.onerror = () => {
                         console.error(`Error getting photo ${meta.id}:`, request.error);
                         rejectPhoto(request.error);
                    };
                });
            });
            
            const photos = await Promise.all(photoPromises);
            // Filter out any null results where a photo might have been missing from DB
            resolve(photos.filter(p => p !== null) as { id: number; url: string; description: string; dateAdded: Date; }[]);

        } catch (error) {
            reject(error);
        }
    });
};