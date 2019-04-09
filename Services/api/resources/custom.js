// Adapt page title
document.title = 'OSR Single Client View | API Documentation';

// Adapt page document
var favicon = document.querySelector('link[rel="shortcut icon"]');
if (!favicon) {
	favicon = document.createElement('link');
	favicon.setAttribute('rel', 'shortcut icon');
	var head = document.querySelector('head');
	head.appendChild(favicon);
}
favicon.setAttribute('type', 'image/x-icon');
favicon.setAttribute('href', '/api/static/resources/favicon.ico');

favicon = document.querySelector('link[sizes="16x16"]');
favicon.setAttribute('type', 'image/x-icon');
favicon.setAttribute('href', '/api/static/resources/favicon.ico');

favicon = document.querySelector('link[sizes="32x32"]');
favicon.setAttribute('type', 'image/x-icon');
favicon.setAttribute('href', '/api/static/resources/favicon.ico');