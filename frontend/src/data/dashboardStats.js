import {
  FaShieldAlt,
  FaCheckCircle,
  FaMapMarkedAlt,
  FaBrain,
} from "react-icons/fa";

const dashboardStats = [
  {
    title: "Total Crimes",
    value: "12,584",
    change: "+8.3% from last month",
    icon: FaShieldAlt,
    color: "text-red-400",
  },
  {
    title: "Solved Cases",
    value: "9,842",
    change: "78.2% resolution",
    icon: FaCheckCircle,
    color: "text-green-400",
  },
  {
    title: "Hotspot Districts",
    value: "11",
    change: "3 districts improved",
    icon: FaMapMarkedAlt,
    color: "text-yellow-400",
  },
  {
    title: "Prediction Accuracy",
    value: "94.7%",
    change: "QuickML Forecast",
    icon: FaBrain,
    color: "text-blue-400",
  },
];

export default dashboardStats;