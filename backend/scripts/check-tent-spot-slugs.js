import mongoose from 'mongoose';
import TentSpot from '../models/tentSpotModel.js';
import dotenv from 'dotenv';

dotenv.config();

const checkTentSpotSlugs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const tentSpots = await TentSpot.find({}, 'spotName location slugUrl');
    
    console.log('\n=== Tent Spot Slugs ===\n');
    tentSpots.forEach(spot => {
      console.log(`Name: ${spot.spotName}`);
      console.log(`Location: ${spot.location}`);
      console.log(`Slug: ${spot.slugUrl}`);
      console.log(`URL: /book-tent/${spot.slugUrl}`);
      console.log('---');
    });

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkTentSpotSlugs();
