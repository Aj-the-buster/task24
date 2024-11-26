const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'your_mongodb_atlas_connection_string';

// Middleware
app.use(cors());
app.use(express.json());

// Define MongoDB Schema
const userDataSchema = new mongoose.Schema({
    age: {
        type: String,
        required: true,
        enum: ['18-24', '25-34', '35-44']
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female', 'Other']
    },
    location: {
        type: String,
        required: true,
        enum: ['North America', 'Europe', 'Asia']
    },
    device: {
        type: String,
        required: true,
        enum: ['Mobile', 'Desktop', 'Tablet']
    }
}, {
    timestamps: true // Add timestamps for created and updated dates
});

const UserData = mongoose.model('UserData', userDataSchema);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB Atlas');
        
        // Check if there's any existing data
        const count = await UserData.countDocuments();
        console.log(`Current document count: ${count}`);
        
        // If no data exists, seed the initial data
        if (count === 0) {
            console.log('No existing data found. Seeding initial data...');
            await seedInitialData();
        }
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Function to seed initial data
async function seedInitialData() {
    try {
        const initialData = [
            { age: '18-24', gender: 'Male', location: 'North America', device: 'Mobile' },
            { age: '25-34', gender: 'Female', location: 'Europe', device: 'Desktop' },
            { age: '25-34', gender: 'male', location: 'Europe', device: 'Desktop' },
            { age: '35-44', gender: 'Other', location: 'Asia', device: 'Tablet' }
        ];

        const result = await UserData.insertMany(initialData);
        console.log(`Successfully seeded ${result.length} documents`);
        console.log('Seeded data:', result);
    } catch (error) {
        console.error('Error seeding initial data:', error);
    }
}

// Routes
app.get('/api/data', async (req, res) => {
    try {
        const allData = await UserData.find({});
        res.json({
            success: true,
            count: allData.length,
            data: allData
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.post('/api/data', async (req, res) => {
    try {
        const { filters } = req.body;
        
        // Build MongoDB query
        const query = {};
        
        if (filters?.age?.length) {
            query.age = { $in: filters.age };
        }
        if (filters?.gender?.length) {
            query.gender = { $in: filters.gender };
        }
        if (filters?.location?.length) {
            query.location = { $in: filters.location };
        }
        if (filters?.device?.length) {
            query.device = { $in: filters.device };
        }

        const filteredData = await UserData.find(query);
        res.json({
            success: true,
            count: filteredData.length,
            data: filteredData
        });
    } catch (error) {
        console.error('Error fetching filtered data:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Manual seed endpoint
app.post('/api/seed', async (req, res) => {
    try {
        await UserData.deleteMany({}); // Clear existing data
        await seedInitialData();
        res.json({ success: true, message: 'Database seeded successfully' });
    } catch (error) {
        console.error('Error in manual seeding:', error);
        res.status(500).json({ success: false, error: 'Error seeding database' });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));