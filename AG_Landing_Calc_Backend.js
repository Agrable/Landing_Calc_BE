console.log('Backend file is starting...');

require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// OpenAI API Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/calculate-revenue', async (req, res) => {
  const { region, size } = req.body;

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
      'https://api.openai.com/v1/chat/completions', // Chat endpoint
      {
        model: 'gpt-4', // Use 'gpt-4' or 'gpt-3.5-turbo'
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
    res.json({ result: gptResponse });
  } catch (error) {
    console.error('Error with OpenAI API:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data); // Logs specific error details from OpenAI
    }
    res.status(500).json({ error: 'Failed to calculate revenue. Please try again.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

