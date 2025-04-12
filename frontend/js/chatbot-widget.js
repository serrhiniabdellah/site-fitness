/**
 * FitZone Chatbot Widget
 * Adds a floating chat button to the website that opens the chatbot in an iframe
 */

document.addEventListener('DOMContentLoaded', function() {
    // Create chatbot widget container
    const chatWidgetContainer = document.createElement('div');
    chatWidgetContainer.id = 'chat-widget-container';
    
    // Create chat toggle button
    const chatButton = document.createElement('div');
    chatButton.id = 'chat-widget-button';
    chatButton.innerHTML = '<i class="fas fa-comment"></i>';
    chatButton.setAttribute('aria-label', 'Open chat support');
    chatButton.setAttribute('title', 'Chat with us');
    
    // Create iframe container
    const iframeContainer = document.createElement('div');
    iframeContainer.id = 'chat-widget-iframe-container';
    
    // Create close button
    const closeButton = document.createElement('div');
    closeButton.id = 'chat-widget-close';
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.setAttribute('aria-label', 'Close chat');
    closeButton.setAttribute('title', 'Close chat');
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'chat-widget-iframe';
    iframe.src = 'chatbot.html';
    iframe.setAttribute('title', 'Chat with FitZone support');
    iframe.setAttribute('loading', 'lazy');
    
    // Assemble the widget
    iframeContainer.appendChild(closeButton);
    iframeContainer.appendChild(iframe);
    chatWidgetContainer.appendChild(chatButton);
    chatWidgetContainer.appendChild(iframeContainer);
    
    // Add the widget to the document
    document.body.appendChild(chatWidgetContainer);
    
    // Add event listeners
    chatButton.addEventListener('click', function() {
        toggleChatWidget();
    });
    
    closeButton.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleChatWidget(false);
    });
    
    // Function to toggle the chat widget visibility
    function toggleChatWidget(show) {
        if (show === undefined) {
            iframeContainer.classList.toggle('active');
        } else if (show) {
            iframeContainer.classList.add('active');
        } else {
            iframeContainer.classList.remove('active');
        }
    }
    
    // Close chat if user clicks outside
    document.addEventListener('click', function(e) {
        if (iframeContainer.classList.contains('active') && 
            !chatWidgetContainer.contains(e.target)) {
            toggleChatWidget(false);
        }
    });
    
    // Listen for messages from the iframe
    window.addEventListener('message', function(event) {
        // Check origin for security
        if (event.origin === window.location.origin) {
            if (event.data === 'closeChatWidget') {
                toggleChatWidget(false);
            }
        }
    });
});