console.log('Backend file is starting...');

require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000; // Use dynamic port if specified, fallback to 3000

// Middleware
app.use(bodyParser.json());

// OpenAI API Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not set. Ensure it is defined in the environment variables.');
  process.exit(1); // Exit the application if the API key is missing
}

app.post('/calculate-revenue', async (req, res) => {
  const { region, size } = req.body;

  // Debugging log
  console.log('Received request:', { region, size });

  // GPT prompt
  const prompt = `
    You are a carbon credit revenue calculator.
    Given the following farm details:
    - Region: ${region}
    - Size: ${size} hectares
    Estimate:
    - Total carbon sequestration potential (in tCO2).
    - Revenue based on €25/tCO2.
    Return the response in this format:
    "Region: {region}
    Total Sequestration Potential: {value} tCO2
    Estimated Revenue: €{value}."
  `;

  try {
    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        }
      }
    );

    // Extract GPT response and send it back to the frontend
    const gptResponse = response.data.choices[0].message.content.trim();
    console.log('GPT Response:', gptResponse); // Debugging log for GPT response
    res.json({ result: gptResponse });
  } catch (error) {
    console.error('Error with OpenAI API:', error.message);

    if (error.response) {
      console.error('Error response data:', error.response.data); // Logs detailed error response from OpenAI
    }

    res.status(500).json({ error: 'Failed to calculate revenue. Please try again.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

