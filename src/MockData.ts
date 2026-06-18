import type { FeedDataPoint } from "./interface/FeedLevels";
import type { NotificationData } from "./interface/Notification";

// ClimateGauge Mock Data
export const climateMockData = [
    {
        id: "temperature",
        title: "dashboardPage.cli_temp",
        value: 18.7,
        unit: "°C",
        type: "temperature",
    },
    {
        id: "humidity",
        title: "dashboardPage.cli_hum",
        value: 65.1,
        unit: "%",
        type: "humidity",
    },
    {
        id: "thi",
        title: "dashboardPage.cli_thi",
        value: 56.8,
        unit: "",
        type: "thi",
    },
] as const;


// Climate Chart Data
export const tempData = [
  { time: "17:00", actual: 19 },
  { time: "21:00", actual: 18.5 },
  { time: "01:00", actual: 24 },
  { time: "05:00", actual: 26 },
  { time: "09:00", actual: 25.5 },
  { time: "13:00", actual: 21 },
  { time: "16:00", actual: 19 }, // Last actual point
  { time: "17:00", predicted: 19 }, // Prediction start
  { time: "21:00", predicted: 22 },
];

export const humidityData = [
  { time: "17:00", actual: 70 },
  { time: "21:00", actual: 78 },
  { time: "01:00", actual: 82 },
  { time: "05:00", actual: 75 },
  { time: "09:00", actual: 66 },
  { time: "13:00", actual: 63 },
  { time: "16:00", actual: 65 },
  { time: "17:00", predicted: 68 },
  { time: "21:00", predicted: 81 },
];

export const thiData = [
  { time: "17:00", actual: 56 },
  { time: "21:00", actual: 57 },
  { time: "01:00", actual: 63 },
  { time: "05:00", actual: 66 },
  { time: "09:00", actual: 64 },
  { time: "13:00", actual: 60 },
  { time: "16:00", actual: 57 },
  { time: "17:00", predicted: 56 },
  { time: "21:00", predicted: 59 },
];


// Feed Level mock data
// Global or Location-specific thresholds
export const LOCATION_1_CONFIG = {
  threshold: 30,
  currentLevel: 77,
};

export const LOCATION_2_CONFIG = {
  threshold: 30, // Alag threshold for testing
  currentLevel: 76,
};

export const feedingData1: FeedDataPoint[] = [
  { time: '17:00', level: 98, isFeedingPoint: true },
  { time: '21:00', level: 85 },
  { time: '01:00', level: 75 },
  { time: '05:00', level: 65 },
  { time: '07:00', level: 55 },
  { time: '08:00', level: 98, isFeedingPoint: true },
  { time: '13:00', level: 85 },
  { time: '16:00', level: 77 },
  { time: '17:00', predictedLevel: 98, level: 0, isFeedingPoint: true },
  { time: '21:00', predictedLevel: 85, level: 0 },
  { time: '23:00', predictedLevel: 80, level: 0 },
];

export const feedingData2: FeedDataPoint[] = feedingData1.map(d => ({
  ...d,
  level: d.level ? d.level - 5 : 0,
  predictedLevel: d.predictedLevel ? d.predictedLevel - 5 : undefined,
}));

export const FEEDING_LOCATIONS = [
  {
    id: "loc-1",
    title: "Feeding Location 1",
    data: feedingData1,
    config: {
      currentLevel: 78,
      threshold: 60,
    },
  },
  // {
  //   id: "loc-2",
  //   title: "Feeding Location 2",
  //   data: feedingData2,
  //   config: {
  //     currentLevel: 72,
  //     threshold: 55,
  //   },
  // },
  // Future locations easily add ho sakti hain
];


// Alert & Notification Data
export const mockNotifications: NotificationData[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Low feed level @ Feeding Location 1',
    suggestedAction: 'Schedule immediate feeding',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Animal showing health issues',
    suggestedAction: 'Schedule vet appointment',
  },
  {
    id: '3',
    type: 'info',
    title: 'Low feed level predicted for Feeding Location 1 @ 14:30',
    suggestedAction: 'Consider scheduling feeding before this time',
    isPredicted: true,
  },
];

export const mockAnimalDetail = [
  {
    label: "Animal ID",
    value: "A-2847",
  },
  {
    label: "Tag",
    value: "MooHero #2847",
  },
  {
    label: "Location",
    value: "Barn 2 - Section A",
  },
  {
    label: "Detected At",
    value: "11:30",
  },
  {
    label: "Severity",
    value: "Medium",
  },
  {
    label: "Symptoms",
    value: [
      "Reduced activity",
      "Lower feed intake",
      "Abnormal temperature",
    ],
  },
]

export const mockAlertDetail: import("./interface/Notification").WSAlert = {
    alert_type: "animal_health_issue",
    severity: "warning",
    message: "Animal A-2847 (MooHero #2847) detected with reduced activity and lower feed intake.",
    timestamp: new Date().toISOString(),
    location_name: "Barn 2 - Section A",
    affected_locations: ["Barn 2 - Section A"],
    recommended_actions: ["Isolate animal", "Check temperature", "Call vet if symptoms persist"],
    current_thi: 72,
    temperature: 39.5,
    humidity: 45
};

// Schedule data in feeding management
export const scheduleData = [
    {
        id: 1,
        days: "Mon–Sun",
        time: "08:00",
        location: "Feeding Location 1",
        amount: "500 kg",
    },
    {
        id: 2,
        days: "Mon–Sun",
        time: "08:00",
        location: "Feeding Location 2",
        amount: "200 kg",
    },
    {
        id: 3,
        days: "Mon–Sun",
        time: "17:00",
        location: "Feeding Location 2",
        amount: "400 kg",
    },
];