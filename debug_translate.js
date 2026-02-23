const { translate: googleTranslate } = require('google-translate-api-x');

async function test() {
    console.log('Testing google-translate-api-x...');
    try {
        console.log('googleTranslate type:', typeof googleTranslate);
        const result = await googleTranslate('merhaba', { from: 'tr', to: 'en' });
        console.log('Result:', result);
        console.log('Translated text:', result.text);
    } catch (error) {
        console.error('Error caught in debug script:');
        console.error('Message:', error.message);
        console.error('Full error:', error);
    }
}

test();
