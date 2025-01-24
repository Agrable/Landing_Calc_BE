console.log('Backend file is starting...');

require('dotenv').config(); // Load environment variables
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Load Knowledge Documents
const regionSOCData = fs.readFileSync(path.resolve(__dirname, 'region_SOC_database.json'), 'utf-8');
const leversData = fs.readFileSync(path.resolve(__dirname, 'lever_database.json'), 'utf-8');

// Parse JSON files
const regionSOC = JSON.parse(regionSOCData);
const levers = JSON.parse(leversData);

app.post('/calculate-revenue', async (req, res) => {
  const { region, farmTypes, selectedLevers, farmSize } = req.body;

  if (!region || !farmTypes || !selectedLevers || !farmSize) {
    return res.status(400).json({ error: 'All fields are required: region, farm types, selected levers, and farm size.' });
  }

  // Build the GPT prompt
  const prompt = `
    This GPT specializes in estimating the current Soil Organic Carbon (SOC) content for farms and calculating financial returns from selling Carbon Credits (CCs).
    The input data:
    - Region: ${region}
    - Farm Types: ${farmTypes.join(', ')}
    - Selected Practices: ${selectedLevers.join(', ')}
    - Farm Size: ${farmSize} hectares
    
    Using the region SOC data:
    ${JSON.stringify(regionSOC)}

    And available levers for improving SOC:
    ${JSON.stringify(levers)}

    Calculate the total yearly carbon sequestration per hectare and apply the formula:
    total yearly carbon sequestration per hectare * 50 to calculate the yearly revenue per hectare from selling carbon credits.
    Use the minimal revenue figure for a conservative estimate.

    Output:
    - Yearly revenue per hectare
    - Total yearly revenue for the farm
    - Guidance on optimizing SOC improvements and financial outcomes
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
        max_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        }
      }
    );

    // Extract GPT response
    const gptResponse = response.data.choices[0].message.content.trim();
    res.json({ result: gptResponse });
  } catch (error) {
    console.error('Error with OpenAI API:', error.message);

    if (error.response) {
      console.error('Error response data:', error.response.data);
    }

    res.status(500).json({ error: 'Failed to calculate revenue. Please try again.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


