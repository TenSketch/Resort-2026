export interface ResortConfig {
  id: string; // 'vanavihari' | 'jungle-star'
  name: string;
  description: string;
  descriptionShort?: string; // For meta description or smaller cards if needed
  location: string;
  priceCheck: string; // 'Starts from ...'
  priceValue: number | string; // 1750
  images: {
    main: string;
    sideTop: string;
    sideBottom: string;
    gallery: string[]; // Full list of gallery images
  };
  mapEmbedUrl: string;
  googleMapsLink: string;
  distanceInfo: {
    icon: string;
    label: string; // 'Rajahmundry Railway Station'
    details: string; // '84 km · ~2 hours'
  }[];
  actions: {
    viewResort: string; // function name or logic key
    book: string; // 'goToVanavihari'
  },
  routerLinkParam: string; // 'vanvihari' or 'junglestar' for raw query params
}

export const RESORTS_DATA: ResortConfig[] = [
  {
    id: 'vanavihari',
    name: 'Vanavihari, Maredumilli',
    description: 'Nestled in the heart of Maredumilli, Vanavihari is a haven for eco-tourism enthusiasts. Experience the tranquility of bamboo-filled surroundings with cozy cottages managed by local tribal communities.',
    location: 'Maredumilli, Andhra Pradesh',
    priceCheck: 'Starts from',
    priceValue: '₹1750',
    images: {
      main: 'assets/img/Vanavihari-reception.jpg',
      sideTop: 'assets/img/Vanavihari-back.jpg', // Used in bento side top
      sideBottom: 'assets/img/home-gallery/vanavihari-home-gallery-3.jpg', // Used in bento side bottom
      gallery: generateGalleryImages('assets/img/home-gallery/vanavihari-home-gallery-', 2, 16)
    },
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d15212.133581651236!2d81.712357!3d17.601149!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a373b5d52758873%3A0x718f2b2059db5e0a!2sVanavihari%20Maredumilli!5e0!3m2!1sen!2sin!4v1708738599849!5m2!1sen!2sin',
    googleMapsLink: 'https://www.google.com/maps/dir//Vanavihari+Maredumilli',
    distanceInfo: [
      {
        icon: 'fa-solid fa-train',
        label: 'Rajahmundry Railway Station',
        details: '84 km · ~2 hours'
      },
      {
        icon: 'fa-solid fa-plane-arrival',
        label: 'Rajahmundry Airport',
        details: '69.7 km · ~1.5 hours'
      }
    ],
    actions: {
      viewResort: 'goToVanavihari',
      book: 'goToVanavihari'
    },
    routerLinkParam: 'vanvihari'
  },
  {
    id: 'jungle-star',
    name: 'Jungle Star Eco Camp, Valamuru',
    description: 'A unique island-like setting with cottages perched on a hillock, accessed via a thrilling hanging bridge. Surrounded by towering mountains and flowing rivers, it offers eco-friendly adventures in the Eastern Ghats.',
    location: 'Valamuru, Andhra Pradesh',
    priceCheck: 'Starts from',
    priceValue: '₹5,000',
    images: {
      main: 'assets/img/Jungle_Star-reception.jpg',
      sideTop: 'assets/img/Jungle_Star-reception-1.jpg',
      sideBottom: 'assets/img/home-gallery-junglestar/junglestar-home-gallery-3.jpg',
      gallery: generateGalleryImages('assets/img/home-gallery-junglestar/junglestar-home-gallery-', 2, 16)
    },
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3802.321273036429!2d81.63047557463233!3d17.634936395627708!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a3725b319b638ff%3A0x6497bd032f830606!2sJUNGLE%20STAR%20ECO%20CAMP!5e0!3m2!1sen!2sin!4v1708782328839!5m2!1sen!2sin',
    googleMapsLink: 'https://www.google.com/maps/dir//JUNGLE+STAR+ECO+CAMP',
    distanceInfo: [
      {
        icon: 'fa-solid fa-train',
        label: 'Rajahmundry Railway Station',
        details: '94.7 km · ~2.5 hours'
      },
      {
        icon: 'fa-solid fa-plane-arrival',
        label: 'Rajahmundry Airport',
        details: '79.4 km · ~2 hours'
      }
    ],
    actions: {
      viewResort: 'goToJungleStar',
      book: 'goToJungleStar'
    },
    routerLinkParam: 'junglestar'
  }
];


export interface TouristAddOn {
  id: string;
  label: string;
  price?: number | string;
}

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
  capacity?: {
    treksPerDay: number;
    membersPerTrek: number;
    totalCapacity: number;
  };
  timings?: string; // Specific display string
  inclusions?: {
    breakfast?: string[];
    lunch?: string[];
    other?: string[];
  };
  notes?: string[];
  mapurl?: string;
}

export interface TouristSpotCategory {
  key: string;
  title: string;
  icon: string;
  spots: TouristSpotConfig[];
}

export const TOURIST_SPOT_CATEGORIES: TouristSpotCategory[] = [
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
        fees: { entryPerPerson: 500, parkingPerVehicle: 0, cameraPerCamera: 0, parkingTwoWheeler: undefined, parkingFourWheeler: undefined }, // pack fee baseline
        timing: 'morning-and-evening',
        addOns: [],
        detailsFragment: 'soft-trek',
        difficulty: 'Easy',
        distanceKm: 3.5,
        elevationGainM: 351,
        mapurl:"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3802.6307719820206!2d81.6609907!3d17.6202596!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a3724efa9ce126f%3A0x3bc3a36a8f5276ac!2sJalatarangini%20Water%20Fall!5e0!3m2!1sen!2sin!4v1754652808056!5m2!1sen!2sin"
 
      },
    //   {
    //     id: 'medium-trek',
    //     name: 'Medium/Hard Trek: New Trail',
    //     location: 'Maredumilli',
    //     category: 'Trek',
    //     typeLabel: 'Adventure Trek',
    //     images: [
    //        'assets/img/TOURIST-PLACES/Jalatharangani-trek.jpg', // Placeholder
    //        'assets/img/TOURIST-PLACES/Jalatharangani-trek-01.jpg'
    //     ],
    //     fees: { entryPerPerson: 800, parkingPerVehicle: 0, cameraPerCamera: 0, parkingTwoWheeler: undefined, parkingFourWheeler: undefined },
    //     timing: 'morning-afternoon',
    //     addOns: [],
    //     detailsFragment: 'medium-trek',
    //     difficulty: 'Hard',
    //     distanceKm: 5,
    //     elevationGainM: 450
    //   },
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
        fees: { entryPerPerson: 1200, parkingPerVehicle: 0, cameraPerCamera: 0, parkingTwoWheeler: undefined, parkingFourWheeler: undefined },
        timing: 'morning-afternoon',
        addOns: [],
        detailsFragment: 'hard-trek',
        difficulty: 'Hard',
        distanceKm: 7,
        elevationGainM: 600,
        mapurl:"https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d7598.71286350315!2d81.693937!3d17.774938!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a3731c48301f107%3A0x1ee53ed9481524bf!2sGudisa%20View%20point!5e0!3m2!1sen!2sin!4v1754838945890!5m2!1sen!2sin"
      }
    ]
  }
];

function generateGalleryImages(basePath: string, start: number, end: number): string[] {
  const images = [];
  for (let i = start; i <= end; i++) {
    images.push(`${basePath}${i}.jpg`);
  }
  return images;
}
