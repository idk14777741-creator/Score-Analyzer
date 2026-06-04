const values = [];
let prefix = [];
const MAX_COUNT = 20;
const listElement = document.getElementById('valueList');
const prefixElement = document.getElementById('prefixList');
const countElement = document.getElementById('count');
const resultCard = document.getElementById('resultCard');
const valueInput = document.getElementById('valueInput');
const startInput = document.getElementById('startIndex');
const endInput = document.getElementById('endIndex');
const addButton = document.getElementById('addButton');
const calculateButton = document.getElementById('calculateButton');
const statsButton = document.getElementById('statsButton');
const statsCard = document.getElementById('statsCard');
const phaseAvgButton = document.getElementById('phaseAvgButton');
const desiredWindowInput = document.getElementById('desiredWindow');
const phaseAvgCard = document.getElementById('phaseAvgCard');
addButton.addEventListener('click', addValue);
calculateButton.addEventListener('click', calculateRange);
statsButton.addEventListener('click', calculateStats);
phaseAvgButton.addEventListener('click', calculatePhaseAverage);
function addValue() {
  const value = Number(valueInput.value);
  if (!Number.isFinite(value) || value <= 0) {
    showResult('Enter a positive number to add.', 'red');
    return;
  }
  if (values.length >= MAX_COUNT) {
    showResult(`You can add only up to ${MAX_COUNT} values.`, 'red');
    return;
  }
  values.push(value);
  buildPrefix();
  valueInput.value = '';
  updateDisplay();
  showResult('Number added. Enter a range to see the sum and phase.', '');
}
function buildPrefix() {
  prefix = [];
  values.forEach((value, index) => {
    prefix[index] = index === 0 ? value : prefix[index - 1] + value;
  });
}
function updateDisplay() {
  countElement.textContent = values.length;
  listElement.textContent = values.length ? `[${values.join(', ')}]` : '[]';
  prefixElement.textContent = prefix.length ? `[${prefix.join(', ')}]` : '[]';
}
function calculateRange() {
  const start = Number(startInput.value);
  const end = Number(endInput.value);
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    showResult('Use integer indices for the range.', 'red');
    return;
  }
  if (values.length === 0) {
    showResult('Add at least one number before querying a range.', 'red');
    return;
  }
  if (start < 0 || end < 0 || start >= values.length || end >= values.length || start > end) {
    showResult('Invalid range. Use 0-based indices that fit the current array.', 'red');
    return;
  }
  const rangeSum = start === 0 ? prefix[end] : prefix[end] - prefix[start - 1];
  const segment = values.slice(start, end + 1);
  const phase = getPhase(rangeSum);
  resultCard.className = `result-card ${phase.color}`;
  resultCard.innerHTML = `
    <div><strong>Selected range:</strong> ${start} to ${end}</div>
    <div><strong>Values:</strong> [${segment.join(', ')}]</div>
    <div><strong>Range sum:</strong> ${rangeSum}</div>
  `;
}

function calculateStats() {
  if (values.length === 0) {
    statsCard.className = 'stats-card';
    statsCard.textContent = 'Add at least one number to calculate phase statistics.';
    return;
  }
  // if user provided a desired window size, restrict stats to windows of that size
  const desiredWindow = Number(desiredWindowInput.value);
  const useWindow = Number.isInteger(desiredWindow) && desiredWindow > 0 && desiredWindow <= values.length;

  let minSum = Infinity;
  let maxSum = -Infinity;
  let minRange = [0, 0];
  let maxRange = [0, 0];
  let totalSum = 0;
  let count = 0;

  if (useWindow) {
    for (let i = 0; i + desiredWindow - 1 < values.length; i++) {
      const j = i + desiredWindow - 1;
      const rangeSum = i === 0 ? prefix[j] : prefix[j] - prefix[i - 1];
      if (rangeSum < minSum) {
        minSum = rangeSum;
        minRange = [i, j];
      }
      if (rangeSum > maxSum) {
        maxSum = rangeSum;
        maxRange = [i, j];
      }
      totalSum += rangeSum;
      count += 1;
    }
  } else {
    for (let i = 0; i < values.length; i++) {
      for (let j = i; j < values.length; j++) {
        const rangeSum = i === 0 ? prefix[j] : prefix[j] - prefix[i - 1];
        if (rangeSum < minSum) {
          minSum = rangeSum;
          minRange = [i, j];
        }
        if (rangeSum > maxSum) {
          maxSum = rangeSum;
          maxRange = [i, j];
        }
        totalSum += rangeSum;
        count += 1;
      }
    }
  }

  const avgSum = totalSum / (count || 1);

  statsCard.className = 'stats-card';
  statsCard.innerHTML = `
    <div><strong>Best sum:</strong> ${minSum} (range ${minRange[0]} to ${minRange[1]})</div>
    <div><strong>Worst sum:</strong> ${maxSum} (range ${maxRange[0]} to ${maxRange[1]})</div>
    <div><strong>Average sum:</strong> ${avgSum.toFixed(2)}</div>
    <div><small>${useWindow ? `Statistics computed over windows of size ${desiredWindow}.` : 'Statistics computed over all ranges.'}</small></div>
  `;
}

function calculatePhaseAverage() {
  const desiredWindow = Number(desiredWindowInput.value);
  if (!Number.isInteger(desiredWindow) || desiredWindow <= 0) {
    phaseAvgCard.className = 'phase-avg-card';
    phaseAvgCard.textContent = 'Enter a valid positive window size (integer).';
    return;
  }

  if (values.length === 0) {
    phaseAvgCard.className = 'phase-avg-card';
    phaseAvgCard.textContent = 'Add at least one number before calculating window average.';
    return;
  }

  if (desiredWindow > values.length) {
    phaseAvgCard.className = 'phase-avg-card';
    phaseAvgCard.textContent = `Window size too large (max ${values.length}).`;
    return;
  }

  const windowSums = [];
  for (let i = 0; i + desiredWindow - 1 < values.length; i++) {
    const j = i + desiredWindow - 1;
    const rangeSum = i === 0 ? prefix[j] : prefix[j] - prefix[i - 1];
    windowSums.push(rangeSum);
  }

  if (windowSums.length === 0) {
    phaseAvgCard.className = 'phase-avg-card';
    phaseAvgCard.textContent = `No windows of size ${desiredWindow} available.`;
    return;
  }

  const avgSum = windowSums.reduce((a, b) => a + b, 0) / windowSums.length;
  const minSum = Math.min(...windowSums);
  const maxSum = Math.max(...windowSums);

  phaseAvgCard.className = 'phase-avg-card';
  phaseAvgCard.innerHTML = `
    <div><strong>Window size:</strong> ${desiredWindow}</div>
    <div><strong>Average sum:</strong> ${avgSum.toFixed(2)}</div>
    <div><strong>Count of windows:</strong> ${windowSums.length}</div>
    <div><strong>Min sum:</strong> ${minSum}</div>
    <div><strong>Max sum:</strong> ${maxSum}</div>
  `;
}

function getPhase(sum) {
  if (sum < 500) return { label: 'Phase 1', color: 'green' };
  if (sum < 1000) return { label: 'Phase 2', color: 'yellow' };
  return { label: 'Phase 3', color: 'red' };
}
function showResult(message, colorClass) {
  resultCard.className = 'result-card';
  if (colorClass) resultCard.classList.add(colorClass);
  resultCard.textContent = message;
}
