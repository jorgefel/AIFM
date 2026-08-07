import { useState, useEffect } from "react";

export function useROICalculator() {
  const [initialInvestment, setInitialInvestment] = useState(50000);
  const [pricePerNight, setPricePerNight] = useState(100);
  const [daysOccupied, setDaysOccupied] = useState(20);
  const [platformFee, setPlatformFee] = useState(15);
  const [operatingExpenses, setOperatingExpenses] = useState(500);
  const [fixedExpenses, setFixedExpenses] = useState(200);

  const [results, setResults] = useState({
    grossIncome: 0,
    netIncome: 0,
    monthsToROI: 0,
    yearsToROI: 0,
    roiStatus: "good",
    chartData: [] as any[]
  });

  const resetCalculator = () => {
    setInitialInvestment(50000);
    setPricePerNight(100);
    setDaysOccupied(20);
    setPlatformFee(15);
    setOperatingExpenses(500);
    setFixedExpenses(200);
  };

  useEffect(() => {
    const calculateROI = () => {
      // Monthly calculations
      const grossIncome = pricePerNight * daysOccupied;
      const feeAmount = grossIncome * (platformFee / 100);
      const netIncome = grossIncome - feeAmount - operatingExpenses - fixedExpenses;
      
      let months = 0;
      let years = 0;
      let status = "bad";
      
      const newChartData = [];
      let accumulated = 0;
      
      if (netIncome > 0) {
        months = initialInvestment / netIncome;
        years = months / 12;
        
        status = years < 2 ? "excellent" : years < 5 ? "good" : "warning";
        
        // Generate chart data up to ROI completion + 12 months (or max 120 months)
        const projectionMonths = Math.min(Math.ceil(months) + 12, 120);
        
        for (let i = 0; i <= projectionMonths; i++) {
          if (i % 3 === 0 || i === projectionMonths) { // Plot every quarter for performance
            newChartData.push({
              month: `Mes ${i}`,
              valor: i,
              Acumulado: Math.round(accumulated),
              Inversión: initialInvestment
            });
          }
          accumulated += netIncome;
        }
      } else {
        // Generar un gráfico plano si hay pérdidas
        for (let i = 0; i <= 12; i++) {
            newChartData.push({
                month: `Mes ${i}`,
                valor: i,
                Acumulado: 0,
                Inversión: initialInvestment
            });
        }
      }

      setResults({
        grossIncome,
        netIncome,
        monthsToROI: isFinite(months) ? months : 0,
        yearsToROI: isFinite(years) ? years : 0,
        roiStatus: status,
        chartData: newChartData
      });
    };

    calculateROI();
  }, [initialInvestment, pricePerNight, daysOccupied, platformFee, operatingExpenses, fixedExpenses]);

  return {
    initialInvestment, setInitialInvestment,
    pricePerNight, setPricePerNight,
    daysOccupied, setDaysOccupied,
    platformFee, setPlatformFee,
    operatingExpenses, setOperatingExpenses,
    fixedExpenses, setFixedExpenses,
    results,
    resetCalculator
  };
}
