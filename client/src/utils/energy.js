export function dailyEnergy(appliance) {
  return appliance.powerWatts * appliance.quantity * appliance.hoursPerDay / 1000;
}

export function monthlyEnergy(appliance) {
  return dailyEnergy(appliance) * appliance.daysPerMonth;
}

export function calculateTotals(appliances, settings) {
  const dailyKwh = appliances.reduce((sum, item) => sum + dailyEnergy(item), 0);
  const monthlyKwh = appliances.reduce((sum, item) => sum + monthlyEnergy(item), 0);
  return {
    dailyKwh,
    monthlyKwh,
    monthlyCost: monthlyKwh * settings.unitRate + settings.fixedCharge
  };
}

export function money(value) {
  return `LKR ${value.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
