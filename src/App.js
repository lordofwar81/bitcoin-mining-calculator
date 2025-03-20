import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Scatter, Bar, Radar } from 'react-chartjs-2';
import './App.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Define initialInputs outside the component
const initialInputs = {
  hashRate: '102',
  numMachines: '6500',
  power: '3068',
  costPerKwh: '0.015',
  poolFee: '0.15',
  hardwareCost: '5000000',
  monthlyOpex: '55000',
  profitShare: '100',
  forecastMonths: '48',
  difficultyGrowth: '20',
  btcGrowth: '6',
  discountRate: '8',
};

function App() {
  // Input states
  const [hashRate, setHashRate] = useState(initialInputs.hashRate);
  const [numMachines, setNumMachines] = useState(initialInputs.numMachines);
  const [power, setPower] = useState(initialInputs.power);
  const [costPerKwh, setCostPerKwh] = useState(initialInputs.costPerKwh);
  const [poolFee, setPoolFee] = useState(initialInputs.poolFee);
  const [hardwareCost, setHardwareCost] = useState(initialInputs.hardwareCost);
  const [monthlyOpex, setMonthlyOpex] = useState(initialInputs.monthlyOpex);
  const [profitShare, setProfitShare] = useState(initialInputs.profitShare);
  const [forecastMonths, setForecastMonths] = useState(initialInputs.forecastMonths);
  const [difficultyGrowth, setDifficultyGrowth] = useState(initialInputs.difficultyGrowth);
  const [btcGrowth, setBtcGrowth] = useState(initialInputs.btcGrowth);
  const [discountRate, setDiscountRate] = useState(initialInputs.discountRate);

  // Input error states
  const [errors, setErrors] = useState({});

  // API data states
  const [btcPrice, setBtcPrice] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [blockReward, setBlockReward] = useState(null);
  const [networkHashRate, setNetworkHashRate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Result state
  const [result, setResult] = useState(null);
  const [dailyProfits, setDailyProfits] = useState([]);
  const [cumulativeRevenue, setCumulativeRevenue] = useState([]);
  const [scatterData, setScatterData] = useState(null);
  const [barData, setBarData] = useState(null);
  const [boxData, setBoxData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [heatmapHashElecData, setHeatmapHashElecData] = useState(null);
  const [heatmapHashPoolData, setHeatmapHashPoolData] = useState(null);
  const [roiGaugeData, setRoiGaugeData] = useState(null);

  // Parse URL query parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inputsFromUrl = {
      hashRate: params.get('hashRate') || initialInputs.hashRate,
      numMachines: params.get('numMachines') || initialInputs.numMachines,
      power: params.get('power') || initialInputs.power,
      costPerKwh: params.get('costPerKwh') || initialInputs.costPerKwh,
      poolFee: params.get('poolFee') || initialInputs.poolFee,
      hardwareCost: params.get('hardwareCost') || initialInputs.hardwareCost,
      monthlyOpex: params.get('monthlyOpex') || initialInputs.monthlyOpex,
      profitShare: params.get('profitShare') || initialInputs.profitShare,
      forecastMonths: params.get('forecastMonths') || initialInputs.forecastMonths,
      difficultyGrowth: params.get('difficultyGrowth') || initialInputs.difficultyGrowth,
      btcGrowth: params.get('btcGrowth') || initialInputs.btcGrowth,
      discountRate: params.get('discountRate') || initialInputs.discountRate,
    };

    setHashRate(inputsFromUrl.hashRate);
    setNumMachines(inputsFromUrl.numMachines);
    setPower(inputsFromUrl.power);
    setCostPerKwh(inputsFromUrl.costPerKwh);
    setPoolFee(inputsFromUrl.poolFee);
    setHardwareCost(inputsFromUrl.hardwareCost);
    setMonthlyOpex(inputsFromUrl.monthlyOpex);
    setProfitShare(inputsFromUrl.profitShare);
    setForecastMonths(inputsFromUrl.forecastMonths);
    setDifficultyGrowth(inputsFromUrl.difficultyGrowth);
    setBtcGrowth(inputsFromUrl.btcGrowth);
    setDiscountRate(inputsFromUrl.discountRate);
  }, []); // Removed initialInputs from dependency array since it's now a constant outside the component

  // Fetch real-time data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Bitcoin price from CoinGecko
        const priceResponse = await axios.get(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
        );
        const fetchedBtcPrice = priceResponse.data.bitcoin.usd;
        setBtcPrice(fetchedBtcPrice);

        // Difficulty from Blockchain.com
        const diffResponse = await axios.get('https://blockchain.info/q/getdifficulty');
        const fetchedDifficulty = diffResponse.data;
        setDifficulty(fetchedDifficulty);

        // Calculate network hash rate from difficulty
        const calculatedNetworkHashRate = (fetchedDifficulty * 2 ** 32) / 600 / 1e12; // Convert to TH/s
        setNetworkHashRate(calculatedNetworkHashRate);

        // Block reward (static for now; post-2024 halving)
        setBlockReward(3.125);

        setLoading(false);
      } catch (error) {
        alert('Failed to fetch real-time data. Using fallback values.');
        setBtcPrice(106439.12);
        setDifficulty(1.12e14);
        setNetworkHashRate(1445035358.28);
        setBlockReward(3.125);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Input validation
  const validateInputs = () => {
    const newErrors = {};
    const fields = {
      hashRate: parseFloat(hashRate),
      numMachines: parseFloat(numMachines),
      power: parseFloat(power),
      costPerKwh: parseFloat(costPerKwh),
      poolFee: parseFloat(poolFee),
      hardwareCost: parseFloat(hardwareCost),
      monthlyOpex: parseFloat(monthlyOpex),
      profitShare: parseFloat(profitShare),
      forecastMonths: parseFloat(forecastMonths),
      difficultyGrowth: parseFloat(difficultyGrowth),
      btcGrowth: parseFloat(btcGrowth),
      discountRate: parseFloat(discountRate),
    };

    if (isNaN(fields.hashRate) || fields.hashRate <= 0) newErrors.hashRate = 'Must be a positive number';
    if (isNaN(fields.numMachines) || fields.numMachines <= 0) newErrors.numMachines = 'Must be a positive number';
    if (isNaN(fields.power) || fields.power <= 0) newErrors.power = 'Must be a positive number';
    if (isNaN(fields.costPerKwh) || fields.costPerKwh < 0) newErrors.costPerKwh = 'Must be a non-negative number';
    if (isNaN(fields.poolFee) || fields.poolFee < 0) newErrors.poolFee = 'Must be a non-negative number';
    if (isNaN(fields.hardwareCost) || fields.hardwareCost < 0) newErrors.hardwareCost = 'Must be a non-negative number';
    if (isNaN(fields.monthlyOpex) || fields.monthlyOpex < 0) newErrors.monthlyOpex = 'Must be a non-negative number';
    if (isNaN(fields.profitShare) || fields.profitShare < 0 || fields.profitShare > 100) newErrors.profitShare = 'Must be between 0 and 100';
    if (isNaN(fields.forecastMonths) || fields.forecastMonths <= 0) newErrors.forecastMonths = 'Must be a positive number';
    if (isNaN(fields.difficultyGrowth)) newErrors.difficultyGrowth = 'Must be a number';
    if (isNaN(fields.btcGrowth)) newErrors.btcGrowth = 'Must be a number';
    if (isNaN(fields.discountRate) || fields.discountRate < 0) newErrors.discountRate = 'Must be a non-negative number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reset inputs and results
  const resetForm = () => {
    setHashRate(initialInputs.hashRate);
    setNumMachines(initialInputs.numMachines);
    setPower(initialInputs.power);
    setCostPerKwh(initialInputs.costPerKwh);
    setPoolFee(initialInputs.poolFee);
    setHardwareCost(initialInputs.hardwareCost);
    setMonthlyOpex(initialInputs.monthlyOpex);
    setProfitShare(initialInputs.profitShare);
    setForecastMonths(initialInputs.forecastMonths);
    setDifficultyGrowth(initialInputs.difficultyGrowth);
    setBtcGrowth(initialInputs.btcGrowth);
    setDiscountRate(initialInputs.discountRate);
    setErrors({});
    setResult(null);
    setDailyProfits([]);
    setCumulativeRevenue([]);
    setScatterData(null);
    setBarData(null);
    setBoxData(null);
    setForecastData(null);
    setHeatmapHashElecData(null);
    setHeatmapHashPoolData(null);
    setRoiGaugeData(null);
  };

  // Export results to CSV
  const exportToCSV = () => {
    if (!result) return;

    const csvRows = [];
    const headers = [
      'Metric',
      'Daily',
      'Monthly',
      'Yearly',
      'Efficiency',
      'Mining vs Buying',
      'Market Data',
    ];
    csvRows.push(headers.join(','));

    const metrics = [
      ['Revenue ($)', result.daily.revenue.toFixed(2), result.monthly.revenue.toFixed(2), result.yearly.revenue.toFixed(2), '', '', ''],
      ['Profit ($)', result.daily.profit.toFixed(2), result.monthly.profit.toFixed(2), result.yearly.profit.toFixed(2), '', '', ''],
      ['BTC Mined', result.daily.btcMined.toFixed(8), result.monthly.btcMined.toFixed(8), result.yearly.btcMined.toFixed(8), '', '', ''],
      ['Power Cost ($)', result.daily.powerCost.toFixed(2), result.monthly.powerCost.toFixed(2), result.yearly.powerCost.toFixed(2), '', '', ''],
      ['', '', '', '', '', '', ''],
      ['W/TH', '', '', '', result.efficiency.wPerTh.toFixed(2), '', ''],
      ['Break-even (days)', '', '', '', result.efficiency.breakEvenDays ? Math.ceil(result.efficiency.breakEvenDays) : 'Never', '', ''],
      ['ROI/BTC (%)', '', '', '', result.efficiency.roiPerBtc.toFixed(2), '', ''],
      ['Cost/BTC ($)', '', '', '', result.efficiency.costPerBtc.toFixed(2), '', ''],
      ['NPV ($)', '', '', '', result.efficiency.npv.toFixed(2), '', ''],
      ['', '', '', '', '', '', ''],
      ['Mining Value ($)', '', '', '', '', result.comparison.miningValue.toFixed(2), ''],
      ['Buying Value ($)', '', '', '', '', result.comparison.buyingValue.toFixed(2), ''],
      ['Mining ROI (%)', '', '', '', '', result.comparison.miningRoi.toFixed(2), ''],
      ['Buying ROI (%)', '', '', '', '', result.comparison.buyingRoi.toFixed(2), ''],
      ['Recommendation', '', '', '', '', result.comparison.recommendation, ''],
      ['', '', '', '', '', '', ''],
      ['BTC Price ($)', '', '', '', '', '', result.market.btcPrice.toLocaleString()],
      ['Difficulty', '', '', '', '', '', result.market.difficulty.toExponential(2)],
      ['Block Reward (BTC)', '', '', '', '', '', result.market.blockReward],
      ['Network Hash Rate (TH/s)', '', '', '', '', '', result.market.networkHashRate.toLocaleString()],
    ];

    metrics.forEach(row => csvRows.push(row.join(',')));

    csvRows.push('');
    csvRows.push('Day,Daily Profit ($)');
    dailyProfits.forEach((profit, index) => {
      csvRows.push(`${index + 1},${profit.toFixed(2)}`);
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'bitcoin_mining_results.csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  // Share URL
  const shareUrl = () => {
    const params = new URLSearchParams({
      hashRate,
      numMachines,
      power,
      costPerKwh,
      poolFee,
      hardwareCost,
      monthlyOpex,
      profitShare,
      forecastMonths,
      difficultyGrowth,
      btcGrowth,
      discountRate,
    }).toString();

    const shareableUrl = `${window.location.origin}${window.location.pathname}?${params}`;
    navigator.clipboard.writeText(shareableUrl).then(() => {
      alert('Shareable URL copied to clipboard! Paste it to share your calculation.');
    }).catch(err => {
      alert('Failed to copy URL. Please copy it manually: ' + shareableUrl);
    });
  };

  const calculateProfit = () => {
    if (!validateInputs()) {
      alert('Please fix the input errors before calculating.');
      return;
    }

    // Parse inputs
    const hr = parseFloat(hashRate) * parseFloat(numMachines); // Total TH/s
    const pwr = parseFloat(power) * parseFloat(numMachines); // Total Watts
    const cost = parseFloat(costPerKwh);
    const fee = parseFloat(poolFee) / 100 || 0;
    const hwCost = parseFloat(hardwareCost) || 0;
    const opex = parseFloat(monthlyOpex) || 0;
    const profitShareFraction = parseFloat(profitShare) / 100 || 1;
    const months = parseFloat(forecastMonths) || 12;
    const diffGrowth = parseFloat(difficultyGrowth) / 100 || 0;
    const btcGrowthRate = parseFloat(btcGrowth) / 100 || 0;
    const discount = parseFloat(discountRate) / 100 || 0;

    // Validate inputs
    if (!hr || !pwr || !cost || !btcPrice || !networkHashRate || !blockReward) {
      alert('Please fill in all required fields with valid numbers!');
      return;
    }

    // Constants
    const blocksPerDay = 144; // ~10 min/block
    const totalRewardPerDay = blockReward * blocksPerDay; // Total BTC rewarded daily
    const daysPerMonth = 30;

    // Proportion of network hash rate
    const hashFraction = hr / networkHashRate;

    // BTC mined per day (before fees)
    const btcPerDayBeforeFee = hashFraction * totalRewardPerDay;
    const btcPerDay = btcPerDayBeforeFee * (1 - fee);

    // Initial revenue per day
    let revenuePerDay = btcPerDay * btcPrice;

    // Power cost per day
    const powerKwh = pwr / 1000; // Total kW
    const powerCostPerDay = powerKwh * 24 * cost;

    // Daily profit (before OpEx and profit share)
    let profitPerDay = revenuePerDay - powerCostPerDay;

    // Efficiency metrics
    const wPerTh = pwr / hr; // W/TH
    const costPerBtc = btcPerDay > 0 ? powerCostPerDay / btcPerDay : 0; // $/BTC

    // First-month metrics (without difficulty growth)
    const firstMonthBtcMined = btcPerDay * daysPerMonth;
    const firstMonthRevenue = revenuePerDay * daysPerMonth;
    const firstMonthPowerCost = powerCostPerDay * daysPerMonth;
    const firstMonthProfit = (firstMonthRevenue - firstMonthPowerCost - opex) * profitShareFraction;

    // Forecast over months with growth
    let totalRevenue = 0;
    let totalPowerCost = 0;
    let totalOpex = 0;
    let totalBtcMined = 0;
    let currentNetworkHashRate = networkHashRate;
    let currentBtcPrice = btcPrice;
    const dailyProfitsArray = [];
    const cumulativeRevenueArray = [];
    let runningRevenue = 0;

    // Monthly calculations
    for (let month = 1; month <= months; month++) {
      // Adjust network hash rate and BTC price for growth
      const monthlyDiffGrowth = (diffGrowth / 12) * month;
      const monthlyBtcGrowth = (btcGrowthRate / 12) * month;
      currentNetworkHashRate = networkHashRate * (1 + monthlyDiffGrowth);
      currentBtcPrice = btcPrice * (1 + monthlyBtcGrowth);

      // Recalculate BTC mined
      const adjustedHashFraction = hr / currentNetworkHashRate;
      const adjustedBtcPerDay = adjustedHashFraction * totalRewardPerDay * (1 - fee);

      // Revenue and costs for this month
      const monthlyRevenue = adjustedBtcPerDay * daysPerMonth * currentBtcPrice;
      const monthlyPowerCost = powerCostPerDay * daysPerMonth;
      const monthlyProfit = (monthlyRevenue - monthlyPowerCost - opex) * profitShareFraction;

      // Daily profit for each day in the month
      const dailyProfitInMonth = (monthlyProfit / daysPerMonth) * profitShareFraction;
      for (let day = 1; day <= daysPerMonth; day++) {
        dailyProfitsArray.push(dailyProfitInMonth);
      }

      runningRevenue += monthlyRevenue;
      cumulativeRevenueArray.push(runningRevenue);

      totalRevenue += monthlyRevenue;
      totalPowerCost += monthlyPowerCost;
      totalOpex += opex;
      totalBtcMined += adjustedBtcPerDay * daysPerMonth;
    }

    // Total profit (for other metrics)
    const totalProfit = (totalRevenue - totalPowerCost - totalOpex) * profitShareFraction;

    // Daily and yearly metrics
    const dailyRevenue = revenuePerDay;
    const dailyProfit = profitPerDay * profitShareFraction;

    // Yearly metrics (average over forecast period)
    const yearlyRevenue = (totalRevenue / months) * 12;
    const yearlyPowerCost = (totalPowerCost / months) * 12;
    const yearlyProfit = (totalProfit / months) * 12;

    // Break-even (in days)
    const breakEvenDays = dailyProfit > 0 ? (hwCost + totalOpex) / dailyProfit : null;

    // ROI/BTC (based on total profit per BTC mined)
    const roiPerBtc = totalBtcMined > 0 ? (totalProfit / totalBtcMined) / currentBtcPrice * 100 : 0;

    // NPV (Net Present Value)
    let npv = -hwCost;
    for (let month = 1; month <= months; month++) {
      const monthlyCashFlow = ((totalRevenue / months) - (totalPowerCost / months) - opex) * profitShareFraction;
      npv += monthlyCashFlow / Math.pow(1 + (discount / 12), month);
    }

    // Mining vs. Buying Comparison
    const btcBought = hwCost / btcPrice; // BTC bought at spot price at deployment
    const buyingValue = btcBought * currentBtcPrice; // Value of bought BTC at the end
    const buyingRoi = hwCost > 0 ? ((buyingValue - hwCost) / hwCost) * 100 : 0; // Buying ROI

    const miningValue = totalBtcMined * currentBtcPrice; // Value of mined BTC at the end
    const miningRoi = hwCost > 0 ? ((miningValue - hwCost) / hwCost) * 100 : 0; // Mining ROI

    // Recommendation
    let recommendation;
    if (miningValue > buyingValue) {
      recommendation = 'Mining is the better investment';
    } else if (buyingValue > miningValue) {
      recommendation = 'Buying at spot is the better investment';
    } else {
      recommendation = 'Mining and buying are equivalent investments';
    }

    // Data for visualizations
    setDailyProfits(dailyProfitsArray);
    setCumulativeRevenue(cumulativeRevenueArray);

    // Data for Scatter Chart (Hash Rate vs. Electricity Cost)
    const scatterData = {
      datasets: [
        {
          label: 'Profit ($)',
          data: [
            { x: parseFloat(hashRate), y: parseFloat(costPerKwh), profit: dailyProfit },
            { x: parseFloat(hashRate) * 1.2, y: parseFloat(costPerKwh) * 1.2, profit: dailyProfit * 0.8 },
            { x: parseFloat(hashRate) * 0.8, y: parseFloat(costPerKwh) * 0.8, profit: dailyProfit * 1.2 },
          ].map(point => ({ x: point.x, y: point.y, v: point.profit })),
          backgroundColor: (ctx) => {
            const value = ctx.raw?.v || 0;
            return value >= 0 ? 'rgba(40, 167, 69, 0.7)' : 'rgba(220, 53, 69, 0.7)';
          },
          pointRadius: 10,
        },
      ],
    };

    // Data for Bar Chart (Revenue and Costs Comparison)
    const barData = {
      labels: ['Daily', 'Monthly', 'Yearly'],
      datasets: [
        {
          label: 'Revenue ($)',
          data: [dailyRevenue, firstMonthRevenue, yearlyRevenue],
          backgroundColor: '#f4b400',
        },
        {
          label: 'Power Cost ($)',
          data: [powerCostPerDay, firstMonthPowerCost, yearlyPowerCost],
          backgroundColor: '#dc3545',
        },
      ],
    };

    // Data for Box Plot (Profit Distribution, Simulated)
    const boxData = {
      labels: ['Profit Distribution'],
      datasets: [
        {
          label: 'Daily Profit ($)',
          data: dailyProfitsArray.length > 0 ? [
            Math.min(...dailyProfitsArray),
            Math.min(...dailyProfitsArray) * 1.1,
            0,
            Math.max(...dailyProfitsArray) * 0.9,
            Math.max(...dailyProfitsArray),
          ] : [0, 0, 0, 0, 0],
          backgroundColor: 'rgba(40, 167, 69, 0.5)',
          borderColor: '#28a745',
          borderWidth: 1,
        },
      ],
    };

    // Data for Forecast Chart (Radar for Future Profit)
    const forecastData = {
      labels: ['Month 1', 'Month 3', 'Month 6', 'Month 9', 'Month 12'],
      datasets: [
        {
          label: 'Forecasted Profit ($)',
          data: dailyProfitsArray.length > 0 ? [
            dailyProfitsArray[0] * 30,
            dailyProfitsArray[90] * 30,
            dailyProfitsArray[180] * 30,
            dailyProfitsArray[270] * 30,
            dailyProfitsArray[359] * 30,
          ] : [0, 0, 0, 0, 0],
          backgroundColor: 'rgba(0, 123, 255, 0.2)',
          borderColor: '#007bff',
          borderWidth: 1,
        },
      ],
    };

    // Data for Heatmap (Hash Rate vs. Electricity Cost)
    const heatmapHashElecData = {
      datasets: [
        {
          label: 'Profit ($)',
          data: Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => {
            const hrValue = parseFloat(hashRate) * (0.8 + i * 0.1);
            const costValue = parseFloat(costPerKwh) * (0.8 + j * 0.1);
            const hashFraction = hrValue / networkHashRate;
            const btcPerDay = hashFraction * blockReward * 144 * (1 - fee);
            const revenue = btcPerDay * btcPrice;
            const powerCost = (pwr / 1000) * 24 * costValue;
            const profit = revenue - powerCost;
            return { x: hrValue, y: costValue, v: profit };
          })).flat(),
          backgroundColor: (ctx) => {
            const value = ctx.raw?.v || 0;
            return value >= 0 ? `rgba(40, 167, 69, ${value / 10})` : `rgba(220, 53, 69, ${-value / 10})`;
          },
          pointRadius: 20,
        },
      ],
    };

    // Data for Heatmap (Hash Rate vs. Pool Fee)
    const heatmapHashPoolData = {
      datasets: [
        {
          label: 'Profit ($)',
          data: Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => {
            const hrValue = parseFloat(hashRate) * (0.8 + i * 0.1);
            const feeValue = parseFloat(poolFee) * (0.8 + j * 0.1) / 100;
            const hashFraction = hrValue / networkHashRate;
            const btcPerDay = hashFraction * blockReward * 144 * (1 - feeValue);
            const revenue = btcPerDay * btcPrice;
            const powerCost = (pwr / 1000) * 24 * parseFloat(costPerKwh);
            const profit = revenue - powerCost;
            return { x: hrValue, y: feeValue * 100, v: profit };
          })).flat(),
          backgroundColor: (ctx) => {
            const value = ctx.raw?.v || 0;
            return value >= 0 ? `rgba(40, 167, 69, ${value / 10})` : `rgba(220, 53, 69, ${-value / 10})`;
          },
          pointRadius: 20,
        },
      ],
    };

    // Data for ROI Gauge (Radar Chart as a Gauge)
    const roiGaugeData = {
      labels: ['ROI'],
      datasets: [
        {
          label: 'Mining ROI (%)',
          data: [miningRoi],
          backgroundColor: 'rgba(244, 180, 0, 0.5)',
          borderColor: '#f4b400',
          borderWidth: 1,
        },
      ],
    };

    // Set chart data to state
    setScatterData(scatterData);
    setBarData(barData);
    setBoxData(boxData);
    setForecastData(forecastData);
    setHeatmapHashElecData(heatmapHashElecData);
    setHeatmapHashPoolData(heatmapHashPoolData);
    setRoiGaugeData(roiGaugeData);

    setResult({
      daily: { revenue: dailyRevenue, profit: dailyProfit, btcMined: btcPerDay, powerCost: powerCostPerDay },
      monthly: { revenue: firstMonthRevenue, profit: firstMonthProfit, btcMined: firstMonthBtcMined, powerCost: firstMonthPowerCost },
      yearly: { revenue: yearlyRevenue, profit: yearlyProfit, btcMined: (totalBtcMined / months) * 12, powerCost: yearlyPowerCost },
      efficiency: { wPerTh, breakEvenDays, roiPerBtc, costPerBtc, npv },
      comparison: { miningValue, buyingValue, miningRoi, buyingRoi, recommendation },
      market: { btcPrice: currentBtcPrice, difficulty, blockReward, networkHashRate: currentNetworkHashRate }
    });
  };

  // Define lineData and areaData using state variables
  const lineData = {
    labels: dailyProfits.map((_, index) => `Day ${index + 1}`),
    datasets: [
      {
        label: 'Daily Profit ($)',
        data: dailyProfits,
        borderColor: '#f4b400',
        backgroundColor: 'rgba(244, 180, 0, 0.2)',
        fill: true,
      },
    ],
  };

  const areaData = {
    labels: Array.from({ length: parseFloat(forecastMonths) || 12 }, (_, i) => `Month ${i + 1}`),
    datasets: [
      {
        label: 'Cumulative Revenue ($)',
        data: cumulativeRevenue,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.3)',
        fill: true,
      },
    ],
  };

  if (loading) return (
    <div className="App">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading real-time data...</p>
      </div>
    </div>
  );

  return (
    <div className="App">
      <h1>Bitcoin Mining Calculator</h1>
      <div className="live-price">
        <p>Live BTC Price: ${btcPrice?.toLocaleString()}</p>
      </div>
      <div className="input-section">
        <h2>Inputs</h2>
        <div className="input-group">
          <label>Hash Rate per Machine (TH/s):</label>
          <input
            type="number"
            value={hashRate}
            onChange={(e) => setHashRate(e.target.value)}
            onBlur={validateInputs}
            placeholder="e.g., 100"
          />
          {errors.hashRate && <span className="error">{errors.hashRate}</span>}
        </div>
        <div className="input-group">
          <label>Number of Machines:</label>
          <input
            type="number"
            value={numMachines}
            onChange={(e) => setNumMachines(e.target.value)}
            onBlur={validateInputs}
            placeholder="e.g., 1"
          />
          {errors.numMachines && <span className="error">{errors.numMachines}</span>}
        </div>
        <div className="input-group">
          <label>Power per Machine (Watts):</label>
          <input
            type="number"
            value={power}
            onChange={(e) => setPower(e.target.value)}
            onBlur={validateInputs}
            placeholder="e.g., 3000"
          />
          {errors.power && <span className="error">{errors.power}</span>}
        </div>
        <div className="input-group">
          <label>Electricity Cost ($/kWh):</label>
          <input
            type="number"
            value={costPerKwh}
            onChange={(e) => setCostPerKwh(e.target.value)}
            onBlur={validateInputs}
            placeholder="e.g., 0.10"
          />
          {errors.costPerKwh && <span className="error">{errors.costPerKwh}</span>}
        </div>
        <div className="input-group">
          <label>Pool Fee (%):</label>
          <input
            type="number"
            value={poolFee}
            onChange={(e) => setPoolFee(e.target.value)}
            onBlur={validateInputs}
            placeholder="e.g., 1"
          />
          {errors.poolFee && <span className="error">{errors.poolFee}</span>}
        </div>
        <div className="input-group">
          <label>Initial Investment ($):</label>
          <input
            type="number"
            value={hardwareCost}
            onChange={(e) => setHardwareCost(e.target.value)}
            onBlur={validateInputs}
            placeholder="e.g., 10000"
          />
          {errors.hardwareCost && <span className="error">{errors.hardwareCost}</span>}
        </div>
        <div className="input-group">
          <label>Monthly OpEx ($):</label>
          <input
            type="number"
            value={monthlyOpex}
            onChange={(e) => setMonthlyOpex(e.target.value)}
            onBlur={validateInputs}
            placeholder="e.g., 0"
          />
          {errors.monthlyOpex && <span className="error">{errors.monthlyOpex}</span>}
        </div>
        <div className="input-group">
          <label>Profit Share (%):</label>
          <input
            type="number"
            value={profitShare}
            onChange={(e) => setProfitShare(e.target.value)}
            onBlur={validateInputs}
            placeholder="e.g., 100"
          />
          {errors.profitShare && <span className="error">{errors.profitShare}</span>}
        </div>
        <div className="input-group">
          <label>Forecast Months:</label>
          <input
            type="number"
            value={forecastMonths}
            onChange={(e) => setForecastMonths(e.target.value)}
            onBlur={validateInputs}
            placeholder="e.g., 12"
          />
          {errors.forecastMonths && <span className="error">{errors.forecastMonths}</span>}
        </div>
        <div className="input-group">
          <label>Annual Difficulty Growth (%):</label>
          <input
            type="number"
            value={difficultyGrowth}
            onChange={(e) => setDifficultyGrowth(e.target.value)}
            onBlur={validateInputs}
            placeholder="e.g., 0"
          />
          {errors.difficultyGrowth && <span className="error">{errors.difficultyGrowth}</span>}
        </div>
        <div className="input-group">
          <label>Annual BTC Growth (%):</label>
          <input
            type="number"
            value={btcGrowth}
            onChange={(e) => setBtcGrowth(e.target.value)}
            onBlur={validateInputs}
            placeholder="e.g., 0"
          />
          {errors.btcGrowth && <span className="error">{errors.btcGrowth}</span>}
        </div>
        <div className="input-group">
          <label>Discount Rate (%):</label>
          <input
            type="number"
            value={discountRate}
            onChange={(e) => setDiscountRate(e.target.value)}
            onBlur={validateInputs}
            placeholder="e.g., 8"
          />
          {errors.discountRate && <span className="error">{errors.discountRate}</span>}
        </div>
        <div className="button-group">
          <button onClick={calculateProfit}>Calculate</button>
          <button onClick={resetForm} className="secondary">Reset</button>
          {result && <button onClick={exportToCSV} className="secondary">Export to CSV</button>}
          {result && <button onClick={shareUrl} className="secondary">Share URL</button>}
        </div>
      </div>

      {result && (
        <div className="result-section">
          <div className="metrics">
            <div>
              <h2>Daily Metrics</h2>
              <p>Revenue: ${result.daily.revenue.toFixed(2)}</p>
              <p>Profit: <span className={result.daily.profit >= 0 ? 'positive' : 'negative'}>${result.daily.profit.toFixed(2)}</span></p>
              <p>BTC Mined: {result.daily.btcMined.toFixed(8)}</p>
              <p>Power Cost: ${result.daily.powerCost.toFixed(2)}</p>
            </div>
            <div>
              <h2>Monthly Metrics</h2>
              <p>Revenue: ${result.monthly.revenue.toFixed(2)}</p>
              <p>Profit: <span className={result.monthly.profit >= 0 ? 'positive' : 'negative'}>${result.monthly.profit.toFixed(2)}</span></p>
              <p>BTC Mined: {result.monthly.btcMined.toFixed(8)}</p>
              <p>Power Cost: ${result.monthly.powerCost.toFixed(2)}</p>
            </div>
            <div>
              <h2>Yearly Metrics</h2>
              <p>Revenue: ${result.yearly.revenue.toFixed(2)}</p>
              <p>Profit: <span className={result.yearly.profit >= 0 ? 'positive' : 'negative'}>${result.yearly.profit.toFixed(2)}</span></p>
              <p>BTC Mined: {result.yearly.btcMined.toFixed(8)}</p>
              <p>Power Cost: ${result.yearly.powerCost.toFixed(2)}</p>
            </div>
            <div>
              <h2>Efficiency Metrics</h2>
              <p>W/TH: {result.efficiency.wPerTh.toFixed(2)}</p>
              <p>Break-even: {result.efficiency.breakEvenDays ? `${Math.ceil(result.efficiency.breakEvenDays)} days` : 'Never'}</p>
              <p>ROI/BTC: {result.efficiency.roiPerBtc.toFixed(2)}%</p>
              <p>Cost/BTC: ${result.efficiency.costPerBtc.toFixed(2)}</p>
              <p>NPV: ${result.efficiency.npv.toFixed(2)}</p>
            </div>
            <div>
              <h2>Mining vs Buying Comparison</h2>
              <p>Mining Value: ${result.comparison.miningValue.toFixed(2)}</p>
              <p>Buying Value: ${result.comparison.buyingValue.toFixed(2)}</p>
              <p>Mining ROI: ${result.comparison.miningRoi.toFixed(2)}%</p>
              <p>Buying ROI: ${result.comparison.buyingRoi.toFixed(2)}%</p>
              <p>Recommendation: {result.comparison.recommendation}</p>
            </div>
            <div>
              <h2>Market Data</h2>
              <p>BTC Price: ${result.market.btcPrice.toLocaleString()}</p>
              <p>Difficulty: {result.market.difficulty.toExponential(2)}</p>
              <p>Block Reward: {result.market.blockReward} BTC</p>
              <p>Network Hash Rate: {result.market.networkHashRate.toLocaleString()} TH/s</p>
            </div>
          </div>

          <div className="visualizations">
            <div className="chart">
              <h2>Line Chart: Profit Over Time</h2>
              <Line key="line-chart" data={lineData} options={{ responsive: true, scales: { x: { display: false } } }} />
            </div>
            <div className="chart">
              <h2>Scatter Chart: Hash Rate vs. Electricity Cost</h2>
              {scatterData && <Scatter key="scatter-chart" data={scatterData} options={{ responsive: true, scales: { x: { title: { display: true, text: 'Hash Rate (TH/s)' } }, y: { title: { display: true, text: 'Electricity Cost ($/kWh)' } } } }} />}
            </div>
            <div className="chart">
              <h2>Area Chart: Cumulative Revenue</h2>
              <Line key="area-chart" data={areaData} options={{ responsive: true, elements: { line: { tension: 0.4 } } }} />
            </div>
            <div className="chart">
              <h2>Bar Chart: Revenue vs. Costs</h2>
              {barData && <Bar key="bar-chart" data={barData} options={{ responsive: true }} />}
            </div>
            <div className="chart">
              <h2>Box Plot: Profit Distribution</h2>
              {boxData && <Bar key="box-chart" data={boxData} options={{ responsive: true, indexAxis: 'y' }} />}
            </div>
            <div className="chart">
              <h2>Forecast Chart: Future Profit</h2>
              {forecastData && <Radar key="forecast-chart" data={forecastData} options={{ responsive: true }} />}
            </div>
            <div className="chart">
              <h2>Heatmap: Hash Rate vs. Electricity Cost</h2>
              {heatmapHashElecData && <Scatter key="heatmap-hash-elec" data={heatmapHashElecData} options={{ responsive: true, scales: { x: { title: { display: true, text: 'Hash Rate (TH/s)' } }, y: { title: { display: true, text: 'Electricity Cost ($/kWh)' } } } }} />}
            </div>
            <div className="chart">
              <h2>Heatmap: Hash Rate vs. Pool Fee</h2>
              {heatmapHashPoolData && <Scatter key="heatmap-hash-pool" data={heatmapHashPoolData} options={{ responsive: true, scales: { x: { title: { display: true, text: 'Hash Rate (TH/s)' } }, y: { title: { display: true, text: 'Pool Fee (%)' } } } }} />}
            </div>
            <div className="chart">
              <h2>ROI Gauge</h2>
              {roiGaugeData && <Radar key="roi-gauge" data={roiGaugeData} options={{ responsive: true, scales: { r: { min: -100, max: 100 } } }} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;