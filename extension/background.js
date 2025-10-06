// Background service worker for BingoFreebies extension (Manifest V3)
console.log('🔌 BingoFreebies background service worker loaded');

self.addEventListener('install', (event) => {
	console.log('🔌 service worker install');
	// Activate immediately
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	console.log('🔌 service worker activated');
});

// Simple message listener for quick tests
self.addEventListener('message', (event) => {
	console.log('🔌 SW message received:', event.data);
	// echo back
	event.source && event.source.postMessage && event.source.postMessage({reply: 'pong'});
});
