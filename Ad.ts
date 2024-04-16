import * as fs from 'fs';

// Define the Ad interface to match the schema
interface Ad {
    advertiser_id: number;
    title: string;
    description: string;
    image_url: string;
    video_url: string;
    click_url: string;
    target_url: string;
    status: string;
    budget: number;
    targeting_criteria: any; // Adjust this according to your actual JSON structure
}

// Function to read and parse the file
const readAdsFromFile = (filePath: string): Ad[] => {
    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const adsData: Ad[] = JSON.parse(fileContents);
        return adsData;
    } catch (error) {
        console.error('Error reading or parsing the file:', error);
        return [];
    }
};

// Example usage
const adsFilePath = 'path/to/your/file.json';
const adsData = readAdsFromFile(adsFilePath);
console.log('Ads data:', adsData);
