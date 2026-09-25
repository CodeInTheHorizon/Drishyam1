import axios from "axios";

export async function getInsights() {

    const response = await axios.get(

        "/api/insights"

    );

    return response.data.insights;

}