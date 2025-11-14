import { llm } from './llm.js';

async function testAzureConnection() {
  console.log('🧪 Testing Azure OpenAI connection...\n');
  
  // Debug: Print configuration
  console.log('📋 Configuration:');
  console.log('Instance Name:', process.env.AZURE_OPENAI_API_INSTANCE_NAME);
  console.log('Deployment Name:', process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME);
  console.log('API Version:', process.env.AZURE_OPENAI_API_VERSION);
  console.log('API Key:', process.env.AZURE_OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
  console.log();

  try {
    const response = await llm.invoke([
      {
        role: 'user',
        content: 'Hello! What is the Seiko SSC941?'
      }
    ]);

    console.log('✅ Success! Azure OpenAI is working!\n');
    console.log('Response:', response.content);
    
  } catch (error) {
    console.error('❌ Error connecting to Azure OpenAI:\n');
    console.error(error);
  }
}

testAzureConnection();