import { useEffect, useState } from "react";

import { getInsights } from "../services/insightsApi.ts";

export default function useInsights() {

    const [loading, setLoading] =

        useState(true);

    const [insights, setInsights] =

        useState([]);

    useEffect(() => {

        async function load() {

            try {

                const data =

                    await getInsights();

                setInsights(data);

            }

            finally {

                setLoading(false);

            }

        }

        load();

    }, []);

    return {

        loading,

        insights

    };

}