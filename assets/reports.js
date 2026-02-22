// Reports generation functions
function populateReports() {
  // Get the data from localStorage using the correct key
  const seniors = JSON.parse(localStorage.getItem('lingap_profiles_v3') || '[]');
  
  // Calculate date range
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0); // Start of day

  // Initialize data structures
  const activityByDay = {};
  const genderStats = { male: 0, female: 0 };
  const ageGroups = { '60-69': 0, '70-79': 0, '80+': 0 };
  
  // Initialize last 30 days with zero counts
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split('T')[0];
    activityByDay[dateStr] = 0;
  }

  // Process each senior's data
  seniors.forEach(senior => {
    // Process activity data from transactions
    if (senior.transactions && senior.transactions.length > 0) {
      senior.transactions.forEach(transaction => {
        const scanDate = new Date(transaction.timestamp);
        if (scanDate >= thirtyDaysAgo) {
          const dateStr = scanDate.toISOString().split('T')[0];
          if (activityByDay[dateStr] !== undefined) {
            activityByDay[dateStr]++;
          }
        }
      });
    }
    
    // Process gender data
    if (senior.gender) {
      genderStats[senior.gender.toLowerCase()]++;
    }
    
    // Process age data from birth date
    if (senior.birth) {
      const birthDate = new Date(senior.birth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      if (age >= 60 && age < 70) ageGroups['60-69']++;
      else if (age >= 70 && age < 80) ageGroups['70-79']++;
      else if (age >= 80) ageGroups['80+']++;
    }
  });

  // Create activity chart
  const activityCtx = document.getElementById('activityChart');
  if (activityCtx) {
    const dates = Object.keys(activityByDay).sort();
    const counts = dates.map(date => activityByDay[date]);
    
    new Chart(activityCtx, {
      type: 'line',
      data: {
        labels: dates.map(date => new Date(date).toLocaleDateString()),
        datasets: [{
          label: 'Daily Visits',
          data: counts,
          borderColor: 'rgb(12, 140, 71)',
          backgroundColor: 'rgba(12, 140, 71, 0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Senior Citizen Activity',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: {
                size: 12
              }
            },
            grid: {
              color: 'rgba(0,0,0,0.05)'
            }
          },
          x: {
            ticks: {
              font: {
                size: 11
              },
              maxRotation: 45,
              minRotation: 45
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  // Create gender distribution chart
  const genderCtx = document.getElementById('genderChart');
  if (genderCtx) {
    new Chart(genderCtx, {
      type: 'doughnut',
      data: {
        labels: ['Male', 'Female'],
        datasets: [{
          data: [genderStats.male, genderStats.female],
          backgroundColor: ['rgb(12, 140, 71)', 'rgb(250, 204, 21)'],
          borderWidth: 1,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Gender Distribution',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            position: 'bottom'
          }
        },
        cutout: '60%'
      }
    });
  }

  // Create age distribution chart
  const ageCtx = document.getElementById('ageChart');
  if (ageCtx) {
    new Chart(ageCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(ageGroups),
        datasets: [{
          label: 'Number of Seniors',
          data: Object.values(ageGroups),
          backgroundColor: 'rgba(12, 140, 71, 0.7)',
          borderColor: 'rgb(12, 140, 71)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Age Distribution',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: {
                size: 12
              }
            },
            grid: {
              color: 'rgba(0,0,0,0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  // Update summary statistics
  const totalSeniors = seniors.length;
  const activeSeniors = seniors.filter(senior => {
    if (!senior.transactions || senior.transactions.length === 0) return false;
    const lastTransaction = new Date(senior.transactions[senior.transactions.length - 1].timestamp);
    return lastTransaction >= thirtyDaysAgo;
  }).length;

  document.getElementById('totalSeniors').textContent = totalSeniors;
  document.getElementById('activeSeniors').textContent = activeSeniors;
}

// Call setupTabs when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  // Initial population of reports if we're on the reports tab
  if (window.location.hash === '#reports') {
    populateReports();
  }
});