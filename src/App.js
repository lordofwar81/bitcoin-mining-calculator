import React, { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
import { motion } from 'framer-motion';
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

// Lazy load chart components
const Line = React.lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));
const Scatter = React.lazy(() => import('react-chartjs-2').then(module => ({ default: module.Scatter })));
const Bar = React.lazy(() => import('react-chartjs-2').then(module => ({ default: module.Bar })));
const Radar = React.lazy(() => import('react-chartjs-2').then(module => ({ default: module.Radar })));

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
  coinGrowth: '6',
  discountRate: '8',
  coin: 'bitcoin',
};

// Define supported coins and their properties
const supportedCoins = {
  bitcoin: { name: 'Bitcoin', algorithm: 'SHA-256', blockTime: 600, blockReward: 3.125, difficultyApi: 'https://blockchain.info/q/getdifficulty' },
  litecoin: { name: 'Litecoin', algorithm: 'Scrypt', blockTime: 150, blockReward: 6.25, difficultyApi: 'https://api.blockcypher.com/v1/ltc/main' },
  ravencoin: { name: 'Ravencoin', algorithm: 'KawPow', blockTime: 60, blockReward: 2500, difficultyApi: 'https://api-ravencoin.org/difficulty' },
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
  const [coinGrowth, setCoinGrowth] = useState(initialInputs.coinGrowth);
  const [discountRate, setDiscountRate] = useState(initialInputs.discountRate);
  const [coin, setCoin] = useState(initialInputs.coin);

  // API data states
  const [coinPrice, setCoinPrice] = useState(null);
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
  const [sensitivityData, setSensitivityData] = useState(null); // New state for sensitivity analysis

  // Input error states
  const [errors, setErrors] = useState({});

  // Calculate button state
  const [isCalculating, setIsCalculating] = useState(false);

  // Theme state
  const [theme, setTheme] = useState('dark'); // Default to dark theme

  // Detect mobile for chart options
  const [isMobile, setIsMobile] = useState(false);

  // Particle effect state
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate particles for binary code effect
  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        value: Math.random() > 0.5 ? '0' : '1',
        left: Math.random() * 100 + 'vw',
        animationDelay: Math.random() * 5 + 's',
      });
    }
    setParticles(newParticles);
  }, []);

  // Chart options with mobile optimization
  const lineChartOptions = {
    responsive: true,
    scales: { x: { display: false } },
    plugins: { zoom: { zoom: { enabled: !isMobile } } },
  };

  const scatterChartOptions = {
    responsive: true,
    scales: {
      x: { title: { display: true, text: 'Hash Rate (TH/s)' } },
      y: { title: { display: true, text: 'Electricity Cost ($/kWh)' } },
    },
    plugins: { zoom: { zoom: { enabled: !isMobile } } },
  };

  const areaChartOptions = {
    responsive: true,
    elements: { line: { tension: 0.4 } },
    plugins: { zoom: { zoom: { enabled: !isMobile } } },
  };

  const barChartOptions = {
    responsive: true,
    plugins: { zoom: { zoom: { enabled: !isMobile } } },
  };

  const boxChartOptions = {
    responsive: true,
    indexAxis: 'y',
    plugins: { zoom: { zoom: { enabled: !isMobile } } },
  };

  const forecastChartOptions = {
    responsive: true,
    plugins: { zoom: { zoom: { enabled: !isMobile } } },
  };

  const heatmapOptions = {
    responsive: true,
    scales: {
      x: { title: { display: true, text: 'Hash Rate (TH/s)' } },
      y: { title: { display: true, text: isMobile ? 'Cost ($/kWh)' : 'Electricity Cost ($/kWh)' } },
    },
    plugins: { zoom: { zoom: { enabled: !isMobile } } },
  };

  const heatmapPoolOptions = {
    responsive: true,
    scales: {
      x: { title: { display: true, text: 'Hash Rate (TH/s)' } },
      y: { title: { display: true, text: 'Pool Fee (%)' } },
    },
    plugins: { zoom: { zoom: { enabled: !isMobile } } },
  };

  const sensitivityChartOptions = {
    responsive: true,
    scales: {
      x: { title: { display: true, text: 'Bitcoin Price ($)' } },
      y: { title: { display: true, text: 'Electricity Cost ($/kWh)' } },
    },
    plugins: { zoom: { zoom: { enabled: !isMobile } } },
  };

  const roiGaugeOptions = {
    responsive: true,
    scales: { r: { min: -100, max: 100 } },
    plugins: { zoom: { zoom: { enabled: !isMobile } } },
  };

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
      coinGrowth: params.get('coinGrowth') || initialInputs.coinGrowth,
      discountRate: params.get('discountRate') || initialInputs.discountRate,
      coin: params.get('coin') || initialInputs.coin,
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
    setCoinGrowth(inputsFromUrl.coinGrowth);
    setDiscountRate(inputsFromUrl.discountRate);
    setCoin(inputsFromUrl.coin);
  }, []);

  // Fetch real-time data based on selected coin
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const priceResponse = await axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`
        );
        const fetchedCoinPrice = priceResponse.data[coin].usd;
        setCoinPrice(fetchedCoinPrice);

        const coinConfig = supportedCoins[coin];
        let fetchedDifficulty;
        if (coin === 'bitcoin') {
          const diffResponse = await axios.get(coinConfig.difficultyApi);
          fetchedDifficulty = diffResponse.data;
        } else if (coin === 'litecoin') {
          const diffResponse = await axios.get(coinConfig.difficultyApi);
          fetchedDifficulty = diffResponse.data.difficulty;
        } else if (coin === 'ravencoin') {
          const diffResponse = await axios.get(coinConfig.difficultyApi);
          fetchedDifficulty = diffResponse.data.difficulty;
        }
        setDifficulty(fetchedDifficulty);

        const calculatedNetworkHashRate = (fetchedDifficulty * 2 ** 32) / coinConfig.blockTime / 1e12;
        setNetworkHashRate(calculatedNetworkHashRate);
        setBlockReward(coinConfig.blockReward);
        setLoading(false);
      } catch (error) {
        alert('Failed to fetch real-time data. Using fallback values.');
        if (coin === 'bitcoin') {
          setCoinPrice(106439.12);
          setDifficulty(1.12e14);
          setNetworkHashRate(1445035358.28);
          setBlockReward(3.125);
        } else if (coin === 'litecoin') {
          setCoinPrice(80);
          setDifficulty(2e7);
          setNetworkHashRate(500000);
          setBlockReward(6.25);
        } else if (coin === 'ravencoin') {
          setCoinPrice(0.03);
          setDifficulty(100000);
          setNetworkHashRate(5000);
          setBlockReward(2500);
        }
        setLoading(false);
      }
    };
    fetchData();
  }, [coin]);

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
      coinGrowth: parseFloat(coinGrowth),
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
    if (isNaN(fields.coinGrowth)) newErrors.coinGrowth = 'Must be a number';
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
    setCoinGrowth(initialInputs.coinGrowth);
    setDiscountRate(initialInputs.discountRate);
    setCoin(initialInputs.coin);
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
    setSensitivityData(null);
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
      [`Revenue ($)`, result.daily.revenue.toFixed(2), result.monthly.revenue.toFixed(2), result.yearly.revenue.toFixed(2), '', '', ''],
      [`Profit ($)`, result.daily.profit.toFixed(2), result.monthly.profit.toFixed(2), result.yearly.profit.toFixed(2), '', '', ''],
      [`${supportedCoins[coin].name} Mined`, result.daily.coinMined.toFixed(8), result.monthly.coinMined.toFixed(8), result.yearly.coinMined.toFixed(8), '', '', ''],
      ['Power Cost ($)', result.daily.powerCost.toFixed(2), result.monthly.powerCost.toFixed(2), result.yearly.powerCost.toFixed(2), '', '', ''],
      ['', '', '', '', '', '', ''],
      ['W/TH', '', '', '', result.efficiency.wPerTh.toFixed(2), '', ''],
      ['Break-even (days)', '', '', '', result.efficiency.breakEvenDays ? Math.ceil(result.efficiency.breakEvenDays) : 'Never', '', ''],
      [`ROI/${supportedCoins[coin].name} (%)`, '', '', '', result.efficiency.roiPerCoin.toFixed(2), '', ''],
      [`Cost/${supportedCoins[coin].name} ($)`, '', '', '', result.efficiency.costPerCoin.toFixed(2), '', ''],
      ['NPV ($)', '', '', '', result.efficiency.npv.toFixed(2), '', ''],
      ['Break-even Price ($)', '', '', '', result.efficiency.breakEvenPrice.toFixed(2), '', ''],
      ['Hashrate Share (%)', '', '', '', result.efficiency.hashrateShare, '', ''],
      ['', '', '', '', '', '', ''],
      ['Mining Value ($)', '', '', '', '', result.comparison.miningValue.toFixed(2), ''],
      ['Buying Value ($)', '', '', '', '', result.comparison.buyingValue.toFixed(2), ''],
      ['Mining ROI (%)', '', '', '', '', result.comparison.miningRoi.toFixed(2), ''],
      ['Buying ROI (%)', '', '', '', '', result.comparison.buyingRoi.toFixed(2), ''],
      ['Recommendation', '', '', '', '', result.comparison.recommendation, ''],
      ['', '', '', '', '', '', ''],
      [`${supportedCoins[coin].name} Price ($)`, '', '', '', '', '', result.market.coinPrice.toLocaleString()],
      ['Difficulty', '', '', '', '', '', result.market.difficulty.toExponential(2)],
      [`Block Reward (${supportedCoins[coin].name})`, '', '', '', '', '', result.market.blockReward],
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
    link.setAttribute('download', `${coin}_mining_results.csv`);
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
      coinGrowth,
      discountRate,
      coin,
    }).toString();

    const shareableUrl = `${window.location.origin}${window.location.pathname}?${params}`;
    navigator.clipboard.writeText(shareableUrl).then(() => {
      alert('Shareable URL copied to clipboard! Paste it to share your calculation.');
    }).catch(err => {
      alert('Failed to copy URL. Please copy it manually: ' + shareableUrl);
    });
  };

  const calculateProfit = debounce(() => {
    if (!validateInputs()) {
      alert('Please fix the input errors before calculating.');
      return;
    }

    setIsCalculating(true);

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
    const coinGrowthRate = parseFloat(coinGrowth) / 100 || 0;
    const discount = parseFloat(discountRate) / 100 || 0;

    // Validate inputs
    if (!hr || !pwr || !cost || !coinPrice || !networkHashRate || !blockReward) {
      alert('Please fill in all required fields with valid numbers!');
      setIsCalculating(false);
      return;
    }

    // Constants
    const coinConfig = supportedCoins[coin];
    const blocksPerDay = 86400 / coinConfig.blockTime; // Number of blocks per day
    const totalRewardPerDay = blockReward * blocksPerDay; // Total coin rewarded daily
    const daysPerMonth = 30;

    // Proportion of network hashrate
    const hashFraction = hr / networkHashRate;
    const hashrateShare = (hashFraction * 100).toFixed(2); // Percentage of network hashrate

    // Coin mined per day (before fees)
    const coinPerDayBeforeFee = hashFraction * totalRewardPerDay;
    const coinPerDay = coinPerDayBeforeFee * (1 - fee);

    // Initial revenue per day
    let revenuePerDay = coinPerDay * coinPrice;

    // Power cost per day
    const powerKwh = pwr / 1000; // Total kW
    const powerCostPerDay = powerKwh * 24 * cost;

    // Daily profit (before OpEx and profit share)
    let profitPerDay = revenuePerDay - powerCostPerDay;

    // Break-even Bitcoin price
    const totalDailyCost = powerCostPerDay + (opex / daysPerMonth);
    const breakEvenPrice = coinPerDay > 0 ? totalDailyCost / coinPerDay : 0;

    // Efficiency metrics
    const wPerTh = pwr / hr; // W/TH
    const costPerCoin = coinPerDay > 0 ? powerCostPerDay / coinPerDay : 0; // $/Coin

    // First-month metrics (without difficulty growth)
    const firstMonthCoinMined = coinPerDay * daysPerMonth;
    const firstMonthRevenue = revenuePerDay * daysPerMonth;
    const firstMonthPowerCost = powerCostPerDay * daysPerMonth;
    const firstMonthProfit = (firstMonthRevenue - firstMonthPowerCost - opex) * profitShareFraction;

    // Forecast over months with growth
    let totalRevenue = 0;
    let totalPowerCost = 0;
    let totalOpex = 0;
    let totalCoinMined = 0;
    let currentNetworkHashRate = networkHashRate;
    let currentCoinPrice = coinPrice;
    const dailyProfitsArray = [];
    const cumulativeRevenueArray = [];
    let runningRevenue = 0;

    // Monthly calculations
    for (let month = 1; month <= months; month++) {
      // Adjust network hash rate and coin price for growth
      const monthlyDiffGrowth = (diffGrowth / 12) * month;
      const monthlyCoinGrowth = (coinGrowthRate / 12) * month;
      currentNetworkHashRate = networkHashRate * (1 + monthlyDiffGrowth);
      currentCoinPrice = coinPrice * (1 + monthlyCoinGrowth);

      // Recalculate coin mined
      const adjustedHashFraction = hr / currentNetworkHashRate;
      const adjustedCoinPerDay = adjustedHashFraction * totalRewardPerDay * (1 - fee);

      // Revenue and costs for this month
      const monthlyRevenue = adjustedCoinPerDay * daysPerMonth * currentCoinPrice;
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
      totalCoinMined += adjustedCoinPerDay * daysPerMonth;
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

    // ROI/Coin (based on total profit per coin mined)
    const roiPerCoin = totalCoinMined > 0 ? (totalProfit / totalCoinMined) / currentCoinPrice * 100 : 0;

    // NPV (Net Present Value)
    let npv = -hwCost;
    for (let month = 1; month <= months; month++) {
      const monthlyCashFlow = ((totalRevenue / months) - (totalPowerCost / months) - opex) * profitShareFraction;
      npv += monthlyCashFlow / Math.pow(1 + (discount / 12), month);
    }

    // Mining vs. Buying Comparison
    const coinBought = hwCost / coinPrice;
    const buyingValue = coinBought * currentCoinPrice;
    const buyingRoi = hwCost > 0 ? ((buyingValue - hwCost) / hwCost) * 100 : 0;

    const miningValue = totalCoinMined * currentCoinPrice;
    const miningRoi = hwCost > 0 ? ((miningValue - hwCost) / hwCost) * 100 : 0;

    // Recommendation
    let recommendation;
    if (miningValue > buyingValue) {
      recommendation = `Mining is the better investment`;
    } else if (buyingValue > miningValue) {
      recommendation = `Buying at spot is the better investment`;
    } else {
      recommendation = `Mining and buying are equivalent investments`;
    }

    // Sensitivity Analysis (Profit vs. Bitcoin Price and Electricity Cost)
    const sensitivity = [];
    const priceRange = [0.8, 0.9, 1.0, 1.1, 1.2]; // ±20% of current price
    const costRange = [0.8, 0.9, 1.0, 1.1, 1.2]; // ±20% of current electricity cost
    for (let priceFactor of priceRange) {
      for (let costFactor of costRange) {
        const adjustedPrice = coinPrice * priceFactor;
        const adjustedCost = cost * costFactor;
        const adjustedRevenue = coinPerDay * adjustedPrice;
        const adjustedPowerCost = powerKwh * 24 * adjustedCost;
        const adjustedProfit = (adjustedRevenue - adjustedPowerCost - (opex / daysPerMonth)) * profitShareFraction;
        sensitivity.push({
          price: adjustedPrice,
          cost: adjustedCost,
          profit: adjustedProfit,
        });
      }
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
            return value >= 0 ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
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
          backgroundColor: '#00ff00',
        },
        {
          label: 'Power Cost ($)',
          data: [powerCostPerDay, firstMonthPowerCost, yearlyPowerCost],
          backgroundColor: '#ff0000',
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
          backgroundColor: 'rgba(0, 255, 0, 0.5)',
          borderColor: '#00ff00',
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
          backgroundColor: 'rgba(0, 255, 0, 0.2)',
          borderColor: '#00ff00',
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
            const coinPerDay = hashFraction * blockReward * blocksPerDay * (1 - fee);
            const revenue = coinPerDay * coinPrice;
            const powerCost = (pwr / 1000) * 24 * costValue;
            const profit = revenue - powerCost;
            return { x: hrValue, y: costValue, v: profit };
          })).flat(),
          backgroundColor: (ctx) => {
            const value = ctx.raw?.v || 0;
            return value >= 0 ? `rgba(0, 255, 0, ${value / 10})` : `rgba(255, 0, 0, ${-value / 10})`;
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
            const coinPerDay = hashFraction * blockReward * blocksPerDay * (1 - feeValue);
            const revenue = coinPerDay * coinPrice;
            const powerCost = (pwr / 1000) * 24 * parseFloat(costPerKwh);
            const profit = revenue - powerCost;
            return { x: hrValue, y: feeValue * 100, v: profit };
          })).flat(),
          backgroundColor: (ctx) => {
            const value = ctx.raw?.v || 0;
            return value >= 0 ? `rgba(0, 255, 0, ${value / 10})` : `rgba(255, 0, 0, ${-value / 10})`;
          },
          pointRadius: 20,
        },
      ],
    };

    // Data for Sensitivity Analysis Heatmap (Bitcoin Price vs. Electricity Cost)
    const sensitivityChartData = {
      datasets: [
        {
          label: 'Profit ($)',
          data: sensitivity.map(item => ({
            x: item.price,
            y: item.cost,
            v: item.profit,
          })),
          backgroundColor: (ctx) => {
            const value = ctx.raw?.v || 0;
            return value >= 0 ? `rgba(0, 255, 0, ${Math.min(value / 1000, 1)})` : `rgba(255, 0, 0, ${Math.min(-value / 1000, 1)})`;
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
          backgroundColor: 'rgba(0, 255, 0, 0.5)',
          borderColor: '#00ff00',
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
    setSensitivityData(sensitivityChartData);

    setResult({
      daily: { revenue: dailyRevenue, profit: dailyProfit, coinMined: coinPerDay, powerCost: powerCostPerDay },
      monthly: { revenue: firstMonthRevenue, profit: firstMonthProfit, coinMined: firstMonthCoinMined, powerCost: firstMonthPowerCost },
      yearly: { revenue: yearlyRevenue, profit: yearlyProfit, coinMined: (totalCoinMined / months) * 12, powerCost: yearlyPowerCost },
      efficiency: { wPerTh, breakEvenDays, roiPerCoin, costPerCoin, npv, breakEvenPrice, hashrateShare },
      comparison: { miningValue, buyingValue, miningRoi, buyingRoi, recommendation },
      market: { coinPrice: currentCoinPrice, difficulty, blockReward, networkHashRate: currentNetworkHashRate }
    });

    // Simulate calculation delay for effect
    setTimeout(() => {
      setIsCalculating(false);
    }, 1000);
  }, 500);

  // Define lineData and areaData using state variables
  const lineData = {
    labels: dailyProfits.map((_, index) => `Day ${index + 1}`),
    datasets: [
      {
        label: 'Daily Profit ($)',
        data: dailyProfits,
        borderColor: '#00ff00',
        backgroundColor: 'rgba(0, 255, 0, 0.2)',
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
        borderColor: '#00ff00',
        backgroundColor: 'rgba(0, 255, 0, 0.3)',
        fill: true,
      },
    ],
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (loading) return (
    <div className={`App ${theme}`}>
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading real-time data...</p>
      </div>
    </div>
  );

  return (
    <div className={`App ${theme}`}>
      {/* Particle effect for floating binary code (only in dark mode) */}
      {theme === 'dark' && (
        <div className="particles">
          {particles.map(particle => (
            <span
              key={particle.id}
              className="particle"
              style={{
                left: particle.left,
                animationDelay: particle.animationDelay,
              }}
            >
              {particle.value}
            </span>
          ))}
        </div>
      )}

      <motion.div
        className="theme-toggle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <button onClick={toggleTheme}>
          {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </button>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {supportedCoins[coin].name} Mining Calculator
      </motion.h1>
      <motion.div
        className="live-price"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <p>Live {supportedCoins[coin].name} Price: ${coinPrice?.toLocaleString()}</p>
      </motion.div>
      <motion.div
        className="input-section"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <h2>Inputs</h2>
        <div className="input-group">
          <label>Cryptocurrency:</label>
          <select value={coin} onChange={(e) => setCoin(e.target.value)}>
            {Object.keys(supportedCoins).map(coinKey => (
              <option key={coinKey} value={coinKey}>{supportedCoins[coinKey].name}</option>
            ))}
          </select>
        </div>
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
          <label>Annual {supportedCoins[coin].name} Growth (%):</label>
          <input
            type="number"
            value={coinGrowth}
            onChange={(e) => setCoinGrowth(e.target.value)}
            onBlur={validateInputs}
            placeholder="e.g., 0"
          />
          {errors.coinGrowth && <span className="error">{errors.coinGrowth}</span>}
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
          <button onClick={calculateProfit} disabled={isCalculating}>
            {isCalculating ? 'Processing...' : 'Calculate'}
          </button>
          <button onClick={resetForm} className="secondary">Reset</button>
          {result && <button onClick={exportToCSV} className="secondary">Export to CSV</button>}
          {result && <button onClick={shareUrl} className="secondary">Share URL</button>}
        </div>
      </motion.div>
      {result && (
        <motion.div
          className="result-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="metrics">
            {[
              {
                title: 'Daily Metrics',
                data: [
                  { label: 'Revenue', value: `$${result.daily.revenue.toFixed(2)}` },
                  { label: 'Profit', value: `$${result.daily.profit.toFixed(2)}`, className: result.daily.profit >= 0 ? 'positive' : 'negative' },
                  { label: `${supportedCoins[coin].name} Mined`, value: result.daily.coinMined.toFixed(8) },
                  { label: 'Power Cost', value: `$${result.daily.powerCost.toFixed(2)}` },
                ],
              },
              {
                title: 'Monthly Metrics',
                data: [
                  { label: 'Revenue', value: `$${result.monthly.revenue.toFixed(2)}` },
                  { label: 'Profit', value: `$${result.monthly.profit.toFixed(2)}`, className: result.monthly.profit >= 0 ? 'positive' : 'negative' },
                  { label: `${supportedCoins[coin].name} Mined`, value: result.monthly.coinMined.toFixed(8) },
                  { label: 'Power Cost', value: `$${result.monthly.powerCost.toFixed(2)}` },
                ],
              },
              {
                title: 'Yearly Metrics',
                data: [
                  { label: 'Revenue', value: `$${result.yearly.revenue.toFixed(2)}` },
                  { label: 'Profit', value: `$${result.yearly.profit.toFixed(2)}`, className: result.yearly.profit >= 0 ? 'positive' : 'negative' },
                  { label: `${supportedCoins[coin].name} Mined`, value: result.yearly.coinMined.toFixed(8) },
                  { label: 'Power Cost', value: `$${result.yearly.powerCost.toFixed(2)}` },
                ],
              },
              {
                title: 'Efficiency Metrics',
                data: [
                  { label: 'W/TH', value: result.efficiency.wPerTh.toFixed(2) },
                  { label: 'Break-even', value: result.efficiency.breakEvenDays ? `${Math.ceil(result.efficiency.breakEvenDays)} days` : 'Never' },
                  { label: `ROI/${supportedCoins[coin].name}`, value: `${result.efficiency.roiPerCoin.toFixed(2)}%` },
                  { label: `Cost/${supportedCoins[coin].name}`, value: `$${result.efficiency.costPerCoin.toFixed(2)}` },
                  { label: 'NPV', value: `$${result.efficiency.npv.toFixed(2)}` },
                  { label: 'Break-even Price', value: `$${result.efficiency.breakEvenPrice.toFixed(2)}` },
                  { label: 'Hashrate Share', value: `${result.efficiency.hashrateShare}%` },
                ],
              },
              {
                title: 'Mining vs Buying Comparison',
                data: [
                  { label: 'Mining Value', value: `$${result.comparison.miningValue.toFixed(2)}` },
                  { label: 'Buying Value', value: `$${result.comparison.buyingValue.toFixed(2)}` },
                  { label: 'Mining ROI', value: `${result.comparison.miningRoi.toFixed(2)}%` },
                  { label: 'Buying ROI', value: `${result.comparison.buyingRoi.toFixed(2)}%` },
                  { label: 'Recommendation', value: result.comparison.recommendation },
                ],
              },
              {
                title: 'Market Data',
                data: [
                  { label: `${supportedCoins[coin].name} Price`, value: `$${result.market.coinPrice.toLocaleString()}` },
                  { label: 'Difficulty', value: result.market.difficulty.toExponential(2) },
                  { label: 'Block Reward', value: `${result.market.blockReward} ${supportedCoins[coin].name}` },
                  { label: 'Network Hash Rate', value: `${result.market.networkHashRate.toLocaleString()} TH/s` },
                ],
              },
            ].map((section, index) => (
              <motion.div
                key={section.title}
                className="metric-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * index, duration: 0.5 }}
              >
                <h2>{section.title}</h2>
                {section.data.map(item => (
                  <p key={item.label}>
                    {item.label}: <span className={item.className}>{item.value}</span>
                  </p>
                ))}
              </motion.div>
            ))}
          </div>
          <div className="visualizations">
            {[
              { title: 'Line Chart: Profit Over Time', component: <Line key="line-chart" data={lineData} options={lineChartOptions} /> },
              { title: 'Scatter Chart: Hash Rate vs. Electricity Cost', component: scatterData && <Scatter key="scatter-chart" data={scatterData} options={scatterChartOptions} /> },
              { title: 'Area Chart: Cumulative Revenue', component: <Line key="area-chart" data={areaData} options={areaChartOptions} /> },
              { title: 'Bar Chart: Revenue vs. Costs', component: barData && <Bar key="bar-chart" data={barData} options={barChartOptions} /> },
              { title: 'Box Plot: Profit Distribution', component: boxData && <Bar key="box-chart" data={boxData} options={boxChartOptions} /> },
              { title: 'Forecast Chart: Future Profit', component: forecastData && <Radar key="forecast-chart" data={forecastData} options={forecastChartOptions} /> },
              { title: 'Heatmap: Hash Rate vs. Electricity Cost', component: heatmapHashElecData && <Scatter key="heatmap-hash-elec" data={heatmapHashElecData} options={heatmapOptions} /> },
              { title: 'Heatmap: Hash Rate vs. Pool Fee', component: heatmapHashPoolData && <Scatter key="heatmap-hash-pool" data={heatmapHashPoolData} options={heatmapPoolOptions} /> },
              { title: 'Sensitivity Analysis: Bitcoin Price vs. Electricity Cost', component: sensitivityData && <Scatter key="sensitivity-chart" data={sensitivityData} options={sensitivityChartOptions} /> },
              { title: 'ROI Gauge', component: roiGaugeData && <Radar key="roi-gauge" data={roiGaugeData} options={roiGaugeOptions} /> },
            ].map((chart, index) => (
              <motion.div
                key={chart.title}
                className="chart-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 * index, duration: 0.5 }}
              >
                <h2>{chart.title}</h2>
                <Suspense fallback={<div>Loading Chart...</div>}>
                  {chart.component}
                </Suspense>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default App;