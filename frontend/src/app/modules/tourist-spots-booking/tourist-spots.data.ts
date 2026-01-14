import { TouristAddOn } from '../../shared/tourist-spot-selection/tourist-spot-selection.component';

export interface TouristSpotConfig {
  id: string;
  name: string;
  location: string;
  category: 'Waterfall' | 'Picnic' | 'Eco' | 'Trek' | 'ViewPoint';
  typeLabel: string; // user-friendly label
  images: string[];
  fees: { entryPerPerson: number; parkingPerVehicle: number; cameraPerCamera: number; parkingTwoWheeler?: number; parkingFourWheeler?: number };
  addOns: TouristAddOn[];
  timing: 'morning-evening' | 'morning-afternoon' | 'morning-and-evening';
  detailsFragment?: string;
  difficulty?: 'Easy' | 'Hard' | 'Very Hard';
  distanceKm?: number;
  elevationGainM?: number;
  ticketsLeftToday?: number;
}


export interface TouristSpotCategory {
  key: string;
  title: string;
  icon: string;
  spots: TouristSpotConfig[];
}

export const TOURIST_SPOT_CATEGORIES: TouristSpotCategory[] = [
  {
    key: 'waterfalls',
    title: 'Waterfalls',
    icon: '🌊',
    spots: [
      {
        id: 'jalatarangini',
        name: 'Jalatarangini Waterfalls',
        location: 'Maredumilli',
        category: 'Waterfall',
        typeLabel: 'Seasonal Waterfall',
        images: [
          'assets/img/TOURIST-PLACES/Jalatarangini-Waterfalls.jpg',
          'assets/img/TOURIST-PLACES/Jalatarangini-Waterfalls-01.jpg',
          'assets/img/TOURIST-PLACES/Jalatarangini-Waterfalls-02.jpg'
        ],
        fees: { entryPerPerson: 50, parkingPerVehicle: 20, cameraPerCamera: 100, parkingTwoWheeler: 20, parkingFourWheeler: 50 },
        timing: 'morning-evening',
        addOns: [
          { id: 'guide-jalatarangini', label: 'Guide', price: 500 },
          { id: 'transport-jalatarangini', label: 'Transport', price: 'On request' }
        ],
        detailsFragment: 'jalatarangini',
        ticketsLeftToday: 12
      },
      {
        id: 'amruthadhara',
        name: 'Amruthadhara Waterfall',
        location: 'Maredumilli',
        category: 'Waterfall',
        typeLabel: 'Perennial Waterfall',
        images: [
          'assets/img/TOURIST-PLACES/Amruthadhara-Waterfalls.jpg',
          'assets/img/TOURIST-PLACES/Amruthadhara-Waterfalls-01.jpg',
          'assets/img/TOURIST-PLACES/Amruthadhara-Waterfalls-02.jpg'
        ],
        fees: { entryPerPerson: 50, parkingPerVehicle: 15, cameraPerCamera: 50, parkingTwoWheeler: 20, parkingFourWheeler: 50 },
        timing: 'morning-afternoon',
        addOns: [
          { id: 'guide-amruthadhara', label: 'Guide', price: 400 },
          { id: 'refreshments-amruthadhara', label: 'Refreshments', price: 200 }
        ],
        detailsFragment: 'amruthadhara',
        ticketsLeftToday: 5
      }
    ]
  },
  {
    key: 'picnic',
    title: 'Picnic / Eco Attractions',
    icon: '🏞️',
    spots: [
      {
        id: 'karthikavanam',
        name: 'Karthikavanam Picnic Spot',
        location: 'Maredumilli',
        category: 'Picnic',
        typeLabel: 'Wildlife Viewing & Tents',
        images: [
          'assets/img/TOURIST-PLACES/karthikavanam-picnic-spot.jpg',
          'assets/img/TOURIST-PLACES/karthikavanam-picnic-spot-01.jpg'
        ],
        fees: { entryPerPerson: 50, parkingPerVehicle: 20, cameraPerCamera: 0, parkingTwoWheeler: 20, parkingFourWheeler: 50 },
        timing: 'morning-evening',
        addOns: [
          { id: 'tent-2p-karthikavanam', label: 'Two-man tent', price: 1500 },
          { id: 'tent-4p-karthikavanam', label: 'Four-man tent', price: 3000 }
        ],
        detailsFragment: 'karthikavanam',
        ticketsLeftToday: 0
      },
      {
        id: 'mpca',
        name: 'Medicinal Plants Conservation Area (MPCA)',
        location: 'Maredumilli',
        category: 'Eco',
        typeLabel: 'Botanical Preservation Site',
        images: [
          'assets/img/TOURIST-PLACES/MPCA.jpg',
          'assets/img/TOURIST-PLACES/MPCA-01.jpg'
        ],
        fees: { entryPerPerson: 20, parkingPerVehicle: 0, cameraPerCamera: 0, parkingTwoWheeler: 20, parkingFourWheeler: 50 },
        timing: 'morning-evening',
        addOns: [],
        detailsFragment: 'mpca'
      }
    ]
  },
  {
    key: 'treks',
    title: 'Trekking Trails',
    icon: '🥾',
    spots: [
      {
        id: 'soft-trek',
        name: 'Soft Trek: Jalatarangini to G.M. Valasa',
        location: 'Maredumilli',
        category: 'Trek',
        typeLabel: 'Guided Easy Trek',
        images: [
          'assets/img/TOURIST-PLACES/Jalatharangani-entrance.jpg',
          'assets/img/TOURIST-PLACES/Jalatharangani-trek.jpg',
          'assets/img/TOURIST-PLACES/Jalatharangani-trek-01.jpg'
        ],
        fees: { entryPerPerson: 800, parkingPerVehicle: 0, cameraPerCamera: 0, parkingTwoWheeler: 20, parkingFourWheeler: 50 }, // pack fee baseline
        timing: 'morning-and-evening',
        addOns: [],
        detailsFragment: 'soft-trek',
        difficulty: 'Easy',
        distanceKm: 3.5,
        elevationGainM: 351
      },
      {
        id: 'hard-trek',
        name: 'Very Hard Trek: Jungle Star Eco Camp to Nellore',
        location: 'Maredumilli',
        category: 'Trek',
        typeLabel: 'Experienced Trek',
        images: [
          'assets/img/TOURIST-PLACES/junglestar-trek-01.jpg',
          'assets/img/TOURIST-PLACES/junglestar-trek-02.jpg'
        ],
        fees: { entryPerPerson: 1200, parkingPerVehicle: 0, cameraPerCamera: 0, parkingTwoWheeler: 20, parkingFourWheeler: 50 },
        timing: 'morning-afternoon',
        addOns: [],
        detailsFragment: 'hard-trek',
        difficulty: 'Hard',
        distanceKm: 7,
        elevationGainM: 600
      }
    ]
  },
  {
    key: 'viewpoints',
    title: 'View Points',
    icon: '🌅',
    spots: [
      {
        id: 'gudisa',
        name: 'Gudisa View Point',
        location: 'Gudisa Hills',
        category: 'ViewPoint',
        typeLabel: 'Scenic Sunrise / Sunset',
        images: [
          'assets/img/TOURIST-PLACES/gudisa-hills-1.jpg',
          'assets/img/TOURIST-PLACES/gudisa-hills-2.jpg'
        ],
        fees: { entryPerPerson: 100, parkingPerVehicle: 300, cameraPerCamera: 0, parkingTwoWheeler: 20, parkingFourWheeler: 50 }, // simplified: person + vehicle fee
        timing: 'morning-and-evening',
        addOns: [],
        detailsFragment: 'gudisa'
      }
    ]
  }
];
