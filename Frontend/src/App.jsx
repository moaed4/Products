import React, { Suspense, useState, useEffect } from 'react';
import Loader from './components/Loader'; // ✅ Reusable loader component

// Lazy load with retry logic
const lazyWithRetry = (componentImport) =>
  React.lazy(async () => {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await componentImport();
      } catch (err) {
        if (i === maxRetries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  });

const ProductTable = lazyWithRetry(() => import('./components/ProductTable'));

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const minLoadTime = 100;
    const startTime = Date.now();

    const loadTasks = [
      new Promise(resolve => setTimeout(resolve, 100)),
      new Promise(resolve => setTimeout(() => {
        setProgress(30);
        resolve();
      }, 50)),
      new Promise(resolve => setTimeout(() => {
        setProgress(70);
        resolve();
      }, 100))
    ];

    Promise.all(loadTasks)
      .then(() => {
        const remaining = minLoadTime - (Date.now() - startTime);
        if (remaining > 0) {
          return new Promise(resolve => setTimeout(resolve, remaining));
        }
      })
      .then(() => {
        setProgress(100);
        setTimeout(() => setIsLoading(false), 100);
      })
      .catch(err => {
        console.error('Loading error:', err);
        setLoadError(err.message);
      });
  }, []);

  if (loadError) {
    return (
      <div className="error-screen">
        <h2>Loading Error</h2>
        <p>{loadError}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      {isLoading ? (
        
        <Loader  />
      ) : (
        <Suspense fallback={<Loader />}>
          <ProductTable />
        </Suspense>
      )}
    </div>
  );
}

export default App;
