/**
 * Popup Manager Module
 * Handles info popup display and content generation
 */

const PopupManager = {
    currentPopup: null,
    
    // Show popup with content
    showPopup(data, config, latlng) {
        const popup = document.getElementById('info-popup');
        const title = document.getElementById('popup-title');
        const content = document.getElementById('popup-content');
        
        // Set title
        title.textContent = this.getPopupTitle(data, config);
        
        // Generate content based on data type
        content.innerHTML = this.generatePopupContent(data, config);
        
        // Position popup
        this.positionPopup(popup, latlng);
        
        // Show popup
        popup.style.display = 'block';
        
        // Initialize charts after a brief delay to ensure DOM is ready
        setTimeout(() => {
            this.initializeCharts(data, config);
        }, 100);
        
        // Store current popup data
        this.currentPopup = { data, config };
        this.currentLatLng = latlng;
    },
    // Re-position the visible popup after layout changes (results open, resize, etc.)
    reflow() {
        const popup = document.getElementById('info-popup');
        if (!popup || popup.style.display === 'none' || !this.currentLatLng) return;
        this.positionPopup(popup, this.currentLatLng);
        },
    
    // Get popup title
    getPopupTitle(data, config) {
        if (data.name_en) return I18n.regionName(data.name_en);
        if (data.name) return data.name;
        if (data.id) return `${I18n.layerName(config.id, config.name)} - ${data.id}`;
        return I18n.layerName(config.id, config.name) || t('popup.information');
    },
    
    // Generate popup content
    generatePopupContent(data, config) {
        let html = '';
        
        // Switch based on layer type or data source
        switch (config.dataSource) {
            case 'regionsWithBorders':
                html = this.generateRegionContent(data);
                break;
            case 'renewablePoints':
                html = this.generateRenewableContent(data);
                break;
            case 'powerStations':
                html = this.generatePowerStationContent(data);
                break;
            case 'electricityNetwork':
                html = this.generatePowerLineContent(data);
                break;
            case 'wastewaterPlants':
                html = this.generateWastewaterContent(data);
                break;
            case 'oilGasFields':
                html = this.generateOilGasContent(data);
                break;
            case 'co2Storage':
                html = this.generateCO2StorageContent(data);
                break;
            case 'demandPoints':
                html = this.generateDemandContent(data);
                break;
            case 'h2Projects':
                html = this.generateH2ProjectContent(data);
                break;
            default:
                html = this.generateGenericContent(data);
        }
        
        return html;
    },
    
    // Generate region content
    // Generate region content with fixed water units
    generateRegionContent(data) {
        // Get the region name from the GeoJSON properties
        const regionName = data.name_en || data.name || data.NAME_1;
        console.log('Generating popup for region:', regionName);
        
        // Get regional data
        const regionalData = DataLoader.getRegionalData(regionName);
        
        let html = '<div class="popup-section">';
        
        // Renewable energy section
        html += `
            <div class="popup-section-title">${t('popup.resourceSiting')}</div>
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.availableLand')}:</span>
                <span class="popup-metric-value">${regionalData?.available_land_km2 ?? t('results.nA')} km2</span>
            </div>
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.solarPotential')}:</span>
                <span class="popup-metric-value">${regionalData?.pvout_kwh_kwp_yr ?? '--'} kWh/kWp/yr</span>
            </div>
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.windPotential')}:</span>
                <span class="popup-metric-value">${regionalData?.wpd_w_m2_10pct ?? t('results.nA')} W/m2, ${regionalData?.ws_m_s_10pct ?? '--'} m/s</span>
            </div>
            <div class="popup-metric">
            <span class="popup-metric-label">${t('popup.hydropowerPotential')}:</span>
            <span class="popup-metric-value">
                ${regionalData?.hydro_potential_mw ?? '--'} MW
            </span>
            </div>
        </div>
        <div class="popup-section">
            <div class="popup-section-title">${t('popup.waterResources')}</div>
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.freshwater')}:</span>
                <span class="popup-metric-value">${regionalData?.freshwater_mln_m3 || t('results.nA')}</span>
            </div>
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.groundwater')}:</span>
                <span class="popup-metric-value">${regionalData?.groundwater_mln_m3 || t('results.nA')}</span>
            </div>
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.brackishWater')}:</span>
                <span class="popup-metric-value">${regionalData?.brackish_water_mln_m3 || t('results.nA')}</span>
            </div>
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.treatedWastewater')}:</span>
                <span class="popup-metric-value">${regionalData?.wastewater_mln_m3 || t('results.nA')}</span>
            </div>
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.totalAvailable')}:</span>
                <span class="popup-metric-value" style="font-weight: bold; color: var(--blue);">
                    ${regionalData ? 
                    (parseFloat(regionalData.freshwater_mln_m3 || 0) + 
                    parseFloat(regionalData.groundwater_mln_m3 || 0) +
                    parseFloat(regionalData.brackish_water_mln_m3 || 0) + 
                    parseFloat(regionalData.wastewater_mln_m3 || 0)).toFixed(1) : 
                    'N/A'} mln m3/year
                </span>
            </div>
        </div>
    `;
        
        // Add chart only if we have data
        if (regionalData) {
            html += `
            <div class="popup-section">
                <div class="popup-section-title">${t('popup.quickVisuals')}</div>
                <div class="popup-chart" style="margin-bottom:12px;">
                <div style="font-size:12px; color:#666; margin-bottom:6px;">${t('popup.regionVsAvg')}</div>
                <canvas id="region-compare-chart" width="320" height="160"></canvas>
                </div>
                <div class="popup-chart">
                <div style="font-size:12px; color:#666; margin-bottom:6px;">${t('popup.waterBreakdown')}</div>
                <canvas id="region-water-chart" width="320" height="160"></canvas>
                </div>
            </div>`;
            } else {
            html += `
            <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 4px; border: 1px solid #ffc107;">
                <strong>${t('popup.note')}:</strong> ${t('popup.regionalDataMissing')}
            </div>`;
            }
        
        return html;
    },
    
    // Generate wastewater content (updated)
    generateWastewaterContent(data) {
        // Calculate H2 potential from available water
        const dailyH2Potential = data.available_for_reuse_percent ? 
            (data.capacity_m3_day * (data.available_for_reuse_percent/100) / 9).toFixed(0) : t('results.nA');
        
        const annualH2Potential = data.discharge_volume_mln_m3_year && data.available_for_reuse_percent ? 
            (data.discharge_volume_mln_m3_year * 1e6 * (data.available_for_reuse_percent/100) / 9 / 1000).toFixed(1) : t('results.nA');
        
        // Discharge type display
        const dischargeTypeDisplay = {
            'water_body': t('popup.waterBody'),
            'pond_evaporator': t('popup.evaporationPond'),
            'unknown': t('popup.unknown')
        };
        
        // Treatment level display
        const treatmentLevelDisplay = {
            'primary': t('popup.primary'),
            'secondary': t('popup.secondary'), 
            'tertiary': t('popup.tertiary'),
            'unknown': t('popup.unknown')
        };
        
        return `
            <div class="popup-section">
                <div class="popup-section-title">${t('popup.plantInformation')}</div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.city')}:</span>
                    <span class="popup-metric-value">${data.city || t('results.nA')}</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.operator')}:</span>
                    <span class="popup-metric-value">${data.operator || data.name || t('results.nA')}</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.treatmentLevel')}:</span>
                    <span class="popup-metric-value">${treatmentLevelDisplay[data.treatment_level] || data.treatment_level || t('results.nA')}</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.dischargeTo')}:</span>
                    <span class="popup-metric-value" style="font-weight: bold;">
                        ${dischargeTypeDisplay[data.discharge_type] || data.discharge_type || t('results.nA')}
                    </span>
                </div>
            </div>
            <div class="popup-section">
                <div class="popup-section-title">${t('popup.capacityFlow')}</div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.dailyCapacity')}:</span>
                    <span class="popup-metric-value">${this.formatNumber(data.capacity_m3_day || 0)} m3/day</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.annualDischarge')}:</span>
                    <span class="popup-metric-value">${data.discharge_volume_mln_m3_year || 0} mln m3/year</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.availableForReuse')}:</span>
                    <span class="popup-metric-value">${data.available_for_reuse_percent || 0}%</span>
                </div>
            </div>
            <div class="popup-section">
                <div class="popup-section-title">${t('popup.h2ProductionPotential')}</div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.dailyH2Potential')}:</span>
                    <span class="popup-metric-value">${dailyH2Potential} kg/day</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.annualH2Potential')}:</span>
                    <span class="popup-metric-value">${annualH2Potential} kt/year</span>
                </div>
            </div>
            ${data.discharge_type === 'pond_evaporator' ? `
            <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 4px; border: 1px solid #ffc107;">
                <strong>${t('popup.note')}:</strong> ${t('popup.evaporationPondNote')}
            </div>
            ` : ''}
        `;
    },
    
    // Generate oil & gas field content
    generateOilGasContent(data) {
        return `
            <div class="popup-section">
                <div class="popup-section-title">Field Information</div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Type:</span>
                    <span class="popup-metric-value">${data.type || 'N/A'}</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Reserves:</span>
                    <span class="popup-metric-value">${data.reserves_bcm || 0} BCM</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Production:</span>
                    <span class="popup-metric-value">${data.production_bcm_year || 0} BCM/year</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Operator:</span>
                    <span class="popup-metric-value">${data.operator || 'N/A'}</span>
                </div>
            </div>
            <div class="popup-section">
                <div class="popup-section-title">Gas Composition vol.%</div>
                <div class="popup-chart">
                    <canvas id="composition-chart" width="300" height="150"></canvas>
                </div>
            </div>
        `;
    },
    
    // Generate CO2 storage content
    generateCO2StorageContent(data) {
        // Calculate additional metrics
        const totalVolume = (data.area_km2 * data.thickness_m * 1000) / 1e6; // Million m³
        const effectiveVolume = totalVolume * (data.porosity || 0.1) * (data.efficiency_factor || 0.005);
        const theoreticalCapacity = effectiveVolume * (data.density_kg_m3 || 700) / 1e6; // Mt CO2
        
        return `
            <div class="popup-section">
                <div class="popup-section-title">Storage Site Details</div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Type:</span>
                    <span class="popup-metric-value">${this.formatStorageType(data.type)}</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Storage Capacity:</span>
                    <span class="popup-metric-value">${data.storage_capacity_mt || data.capacity_mtco2 || 0} Mt CO₂</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Area:</span>
                    <span class="popup-metric-value">${this.formatNumber(data.area_km2 || 0)} km²</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Thickness:</span>
                    <span class="popup-metric-value">${this.formatNumber(data.thickness_m || 0)} m</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Status:</span>
                    <span class="popup-metric-value">${this.formatStatus(data.status)}</span>
                </div>
            </div>
            <div class="popup-section">
                <div class="popup-section-title">Technical Parameters</div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Porosity:</span>
                    <span class="popup-metric-value">${((data.porosity || 0) * 100).toFixed(1)}%</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Storage Efficiency:</span>
                    <span class="popup-metric-value">${((data.efficiency_factor || 0) * 100).toFixed(2)}%</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">CO₂ Density:</span>
                    <span class="popup-metric-value">${data.density_kg_m3 || 700} kg/m³</span>
                </div>
            </div>
        `;
    },
    
    // Generate demand point content
    generateDemandContent(data) {
        return `
            <div class="popup-section">
                <div class="popup-section-title">${t('popup.demandPoint')}</div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.type')}:</span>
                    <span class="popup-metric-value">${data.type || 'N/A'}</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.currentDemand')}:</span>
                    <span class="popup-metric-value">${data.current_h2_demand_kt_year || 0} kt/year</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.potentialDemand')}:</span>
                    <span class="popup-metric-value">${data.potential_h2_demand_kt_year || 0} kt/year</span>
                </div>
                ${data.notes ? `
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.notes')}:</span>
                    <span class="popup-metric-value">${data.notes}</span>
                </div>
                ` : ''}
            </div>
        `;
    },

    generateH2ProjectContent(data) {
        return `
            <div class="popup-section">
                <div class="popup-section-title">${t('popup.hydrogenProjectDetails')}</div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.projectName')}:</span>
                    <span class="popup-metric-value">${data.name || 'H₂ Project'}</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.type')}:</span>
                    <span class="popup-metric-value" style="color: ${data.type === 'green' ? '#4caf50' : '#2196f3'};">
                        🟢 ${t('popup.greenType')}
                    </span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.location')}:</span>
                    <span class="popup-metric-value">${data.city || 'Kazakhstan'}</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.status')}:</span>
                    <span class="popup-metric-value">
                        ${data.status === 'operational' ? `✅ ${t('popup.operational')}` : 
                        data.status === 'construction' ? `🚧 ${t('popup.construction')}` : `📋 ${t('popup.planned')}`} 
                    </span>
                </div>
            </div>
            <div class="popup-section">
                <div class="popup-section-title">${t('popup.technicalSpecifications')}</div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.capacity')}:</span>
                    <span class="popup-metric-value">${data.capacity_mw || 'N/A'} MW</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.production')}:</span>
                    <span class="popup-metric-value">${data.production_kt_year || 'N/A'} kt/year</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.technology')}:</span>
                    <span class="popup-metric-value">${data.technology || 'N/A'}</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.commissioning')}:</span>
                    <span class="popup-metric-value">${data.commissioning_year || 'N/A'}</span>
                </div>
            </div>
            ${data.description ? `
            <div class="popup-section">
                <div class="popup-section-title">${t('popup.description')}</div>
                <div style="padding: 10px; background: #f5f5f5; border-radius: 4px; font-size: 12px;">
                    ${data.description}
                </div>
            </div>
            ` : ''}
        `;
    },


// Generate renewable energy content (supports wind/solar/hydro and partial fields)
generateRenewableContent(data) {
    const type = (data.type || data.subtype || '').toString().toLowerCase();
    const capacity = data.capacity_mw ?? data.capacity ?? null;
    const emoji = type.includes('wind') || type.includes('вэс') ? '🌬️' :
                  type.includes('solar') || type.includes('сэс') ? '☀️' :
                  type.includes('hydro') || type.includes('гэс') ? '💧' : '♻️';
    const label = type.includes('wind') || type.includes('вэс') ? 'Wind' :
                  type.includes('solar') || type.includes('сэс') ? 'Solar' :
                  type.includes('hydro') || type.includes('гэс') ? 'Hydro' : 'Renewable';
    return `
        <div class="popup-section">
            <div class="popup-section-title">${emoji} ${t('popup.renewablePlant', { type: label })}</div>
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.name')}:</span>
                <span class="popup-metric-value">${data.name_en || data.name || '—'}</span>
            </div>
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.capacity')}:</span>
                <span class="popup-metric-value">${capacity ? `${capacity} MW` : 'N/A'}</span>
            </div>
            ${data.owner ? `
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.ownerOperator')}:</span>
                <span class="popup-metric-value">${data.owner}</span>
            </div>` : ''}
            ${data.commissioning_year ? `
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.commissioning')}:</span>
                <span class="popup-metric-value">${data.commissioning_year}</span>
            </div>` : ''}
            ${data.note ? `
            <div class="popup-section">
                <div class="popup-section-title">${t('popup.notes')}</div>
                <div style="padding: 10px; background: #f5f5f5; border-radius: 4px; font-size: 12px;">
                    ${data.note}
                </div>
            </div>` : ''}
        </div>
    `;
},

// Major thermal power stations popup
generatePowerStationContent(data) {
    const cls = (data.type || data.subtype || '').toString().toLowerCase();
    const emoji = cls.includes('coal') || cls.includes('угол') ? '🪨' :
                  cls.includes('gas') || cls.includes('газ') ? '🔥' : '🏭';
    const cap = data.capacity_mw ?? null;
    return `
        <div class="popup-section">
            <div class="popup-section-title">${emoji} ${t('popup.powerStation')}</div>
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.name')}:</span>
                <span class="popup-metric-value">${data.name_en || data.name || '—'}</span>
            </div>
            ${data.subtype ? `
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.type')}:</span>
                <span class="popup-metric-value">${data.subtype}</span>
            </div>` : ''}
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.capacity')}:</span>
                <span class="popup-metric-value">${cap ? `${cap} MW` : 'N/A'}</span>
            </div>
            ${data.fuel ? `
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.fuel')}:</span>
                <span class="popup-metric-value">${data.fuel}</span>
            </div>` : ''}
            ${data.owner ? `
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.ownerOperator')}:</span>
                <span class="popup-metric-value">${data.owner}</span>
            </div>` : ''}
            ${data.note ? `
            <div class="popup-section">
                <div class="popup-section-title">${t('popup.notes')}</div>
                <div style="padding: 10px; background: #f5f5f5; border-radius: 4px; font-size: 12px;">
                    ${data.note}
                </div>
            </div>` : ''}
        </div>
    `;
},

// Power line popup
generatePowerLineContent(data) {
    const kv = data.voltage_kv || data.voltage || data.kv;
    return `
        <div class="popup-section">
            <div class="popup-section-title">⚡ ${t('popup.powerLine')}</div>
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.name')}:</span>
                <span class="popup-metric-value">${data.name_en || data.name || data.line_name || '—'}</span>
            </div>
            ${kv ? `
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.voltage')}:</span>
                <span class="popup-metric-value">${kv} kV</span>
            </div>` : ''}
            ${data.owner || data.operator ? `
            <div class="popup-metric">
                <span class="popup-metric-label">${t('popup.ownerOperator')}:</span>
                <span class="popup-metric-value">${data.owner || data.operator}</span>
            </div>` : ''}
        </div>
    `;
},

    // Generate generic content
    generateGenericContent(data) {
        let html = '<div class="popup-section">';
        
        Object.keys(data).forEach(key => {
            if (key !== 'id' && data[key] !== null && data[key] !== undefined) {
                html += `
                    <div class="popup-metric">
                        <span class="popup-metric-label">${this.formatLabel(key)}:</span>
                        <span class="popup-metric-value">${data[key]}</span>
                    </div>
                `;
            }
        });
        
        html += '</div>';
        return html;
    },
    
    // Initialize charts in popup
    // Initialize charts in popup
    initializeCharts(data, config) {
    console.log('Initializing charts for:', config.dataSource);

    // Destroy any existing charts first
    if (window.popupCharts) {
        Object.values(window.popupCharts).forEach(ch => { try { ch?.destroy(); } catch(e){} });
    }
    window.popupCharts = {};

    // Gas composition chart
    const compositionChartCanvas = document.getElementById('composition-chart');
    if (compositionChartCanvas) {
        console.log('Creating composition chart');
        this.createCompositionChart(data);
    }

    // Storage chart
    const storageChartCanvas = document.getElementById('storage-chart');
    if (storageChartCanvas) {
        console.log('Creating storage chart');
        this.createStorageChart(data);
    }

    // --- Region Quick Visuals (add this block) ---
    const isRegionLayer = ['regionsWithBorders', 'regions'].includes(config?.dataSource);
    const compareEl = document.getElementById('region-compare-chart');
    const waterEl   = document.getElementById('region-water-chart');
    if ((compareEl || waterEl) && isRegionLayer) {
        const regionName = data.name_en || data.name || data.NAME_1;
        const regionalData = regionName ? DataLoader.getRegionalData(regionName) : null;
        if (regionalData) {
        if (compareEl) this.createRegionCompareIndexChart(regionalData); // apples-to-apples (KZ = 100) with dashed 100% line
        if (waterEl)   this.createRegionWaterChart(regionalData);        // water breakdown pie
        }
    }

    // Optional: if you still show single-canvas version
    const singleEl = document.getElementById('region-resources-chart');
    if (singleEl && isRegionLayer) {
        const regionName = data.name_en || data.name || data.NAME_1;
        const regionalData = regionName ? DataLoader.getRegionalData(regionName) : null;
        if (regionalData) this.createRegionResourcesChart(singleEl, regionalData);
    }
    },
    // Create gas composition chart
    createCompositionChart(data) {
        const ctx = document.getElementById('composition-chart').getContext('2d');
        const methane = data.methane_percent || 75;
        const ethane = data.ethane_percent || 0;
        const propane = data.propane_percent || 0;
        const butane = data.butane_percent || 0;
        const pentane = data.pentane_percent || 0;
        const others = data.others_percent || 0;
        const remainder = 100 - methane - ethane - propane - butane - pentane - others;

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['CH₄', 'C₂H₆', 'C₃H₈', 'C₄H₁₀', 'C₅H₁₂', 'Other'],
                datasets: [{
                    data: [methane, ethane, propane, butane, pentane, others + remainder],
                    backgroundColor: ['#4caf50', '#ff9800', '#f44336', '#9e9e9e', '#607d8b', '#cfd8dc']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    },
    
    // Position popup near click location
    // Replace the whole existing positionPopup() with this:
positionPopup(popup, latlng, _opts = {}) {
  if (!latlng || !MapManager?.map || !popup) return;

  // ---- cancel / anti-frankenstein guards ----
  this._posToken = (this._posToken || 0) + 1;
  const token = this._posToken;

  // If a previous moveend handler was pending, it will be ignored via token check.
  // (We don't need to store/remove the handler explicitly.)

  const map = MapManager.map;
  const mapSize = map.getSize();               // {x, y}
  const anchor = map.latLngToContainerPoint(latlng);

  // Prefer constants for speed (you can tune if your CSS changes)
  const popupWidth  = 450;
  const popupHeight = 600;
  const margin = 12;

  // Make sure popup sits above panels (z-index safety)
  popup.style.zIndex = 9999;

  // Occupied zones (sidebar, schematics, results) in map coords
  const forbidden = (window.UIRects?.getOccupiedRects?.() || []);

  const intersects = (a, b) =>
    !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);

  const intersectsForbidden = (rect) => forbidden.some(f => intersects(rect, f));

  // Clamp helper
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  // Candidate positions: right, left, below, above (more robust than only L/R)
  const candidates = [
    { // right
      x: anchor.x + margin,
      y: clamp(anchor.y - popupHeight / 2, margin, mapSize.y - popupHeight - margin)
    },
    { // left
      x: anchor.x - popupWidth - margin,
      y: clamp(anchor.y - popupHeight / 2, margin, mapSize.y - popupHeight - margin)
    },
    { // below
      x: clamp(anchor.x - popupWidth / 2, margin, mapSize.x - popupWidth - margin),
      y: anchor.y + margin
    },
    { // above
      x: clamp(anchor.x - popupWidth / 2, margin, mapSize.x - popupWidth - margin),
      y: anchor.y - popupHeight - margin
    }
  ];

  // Pick first candidate that fits map + doesn't overlap forbidden
  let chosen = null;
  for (const c of candidates) {
    const rect = { x: c.x, y: c.y, w: popupWidth, h: popupHeight };
    const fitsMap =
      rect.x >= margin &&
      rect.y >= margin &&
      rect.x + rect.w <= mapSize.x - margin &&
      rect.y + rect.h <= mapSize.y - margin;

    if (fitsMap && !intersectsForbidden(rect)) {
      chosen = c;
      break;
    }
  }

  // If nothing fits, pan ONCE, then recompute on moveend (no setTimeout!)
  if (!chosen) {
    const alreadyRetried = !!_opts._retried;
    if (!alreadyRetried) {
      // Try to create space for the preferred candidate (right side)
      const target = candidates[0];
      const rect = { x: target.x, y: target.y, w: popupWidth, h: popupHeight };

      let dx = 0, dy = 0;

      // Keep inside map bounds
      if (rect.x < margin) dx += (margin - rect.x);
      if (rect.x + rect.w > mapSize.x - margin) dx -= (rect.x + rect.w - (mapSize.x - margin));
      if (rect.y < margin) dy += (margin - rect.y);
      if (rect.y + rect.h > mapSize.y - margin) dy -= (rect.y + rect.h - (mapSize.y - margin));

      // Nudge away from forbidden areas (horizontal push is usually enough)
      for (const f of forbidden) {
        if (intersects(rect, f)) {
          const overlapX = Math.max(0, Math.min(rect.x + rect.w, f.x + f.w) - Math.max(rect.x, f.x));
          if (rect.x < f.x) dx -= (overlapX + margin);
          else dx += (overlapX + margin);
        }
      }

      if (dx !== 0 || dy !== 0) {
        map.once('moveend', () => {
          // Ignore stale moveend events
          if (token !== this._posToken) return;
          this.positionPopup(popup, latlng, { _retried: true });
        });

        map.panBy([dx, dy], { animate: true, duration: 0.25 });
        return;
      }
      // if no pan needed, fall through to best-effort placement
    }

    // Best-effort fallback: choose the candidate with minimum forbidden intersections
    let best = candidates[0];
    let bestScore = Infinity;

    for (const c of candidates) {
      const rect = { x: c.x, y: c.y, w: popupWidth, h: popupHeight };

      // score: how many forbidden rects it intersects + how far off-map it is
      let score = 0;
      for (const f of forbidden) if (intersects(rect, f)) score += 1000;

      const offLeft   = Math.max(0, margin - rect.x);
      const offTop    = Math.max(0, margin - rect.y);
      const offRight  = Math.max(0, (rect.x + rect.w) - (mapSize.x - margin));
      const offBottom = Math.max(0, (rect.y + rect.h) - (mapSize.y - margin));
      score += (offLeft + offTop + offRight + offBottom);

      if (score < bestScore) {
        bestScore = score;
        best = c;
      }
    }

    chosen = best;
  }

  // Place popup
  popup.style.left = `${chosen.x}px`;
  popup.style.top  = `${chosen.y}px`;
},


    
    // Helper functions
    formatNumber(num) {
        if (!num) return '0';
        return num.toLocaleString();
    },
    
    formatLabel(key) {
        return key.replace(/_/g, ' ')
                  .replace(/\b\w/g, l => l.toUpperCase());
    },
    
    calculateH2FromWaterMln(regionalData) {
        if (!regionalData) return 'N/A';
        
        // Total water in million m³/year
        const totalWaterMln = parseFloat(regionalData.freshwater_mln_m3 || 0) + 
                            parseFloat(regionalData.groundwater_mln_m3 || 0) +
                            parseFloat(regionalData.brackish_water_mln_m3 || 0) + 
                            parseFloat(regionalData.wastewater_mln_m3 || 0);
        
        // Convert to m³
        const totalWater = totalWaterMln * 1e6;
        
        // Assume 10% of water can be used for H2 production
        const availableWater = totalWater * 0.1;
        
        // 9 liters (0.009 m³) of water per kg H2
        const h2Production = availableWater / 0.009 / 1000000; // Convert to kt
        
        return h2Production > 0 ? h2Production.toFixed(0) : 'N/A';
    },
    // Keep the original calculateH2FromWater for backward compatibility
    calculateH2FromWater(regionalData) {
        // This function now calls the million m³ version
        return this.calculateH2FromWaterMln(regionalData);
    },

    // Calculate H2 from energy (unchanged)
    calculateH2FromEnergy(regionalData) {
        if (!regionalData) return 'N/A';
        
        // Total renewable capacity in MW
        const totalRenewable = (parseFloat(regionalData.wind_potential_gw || 0) + 
                            parseFloat(regionalData.solar_potential_gw || 0)) * 1000;
        
        // Assume 30% capacity factor average
        const annualEnergy = totalRenewable * 8760 * 0.3; // MWh/year
        
        // 55 kWh per kg H2
        const h2Production = annualEnergy * 1000 / 55 / 1000000; // Convert to kt
        
        return h2Production.toFixed(0);
    },

    // Determine limiting factor (million m³ version)
    determineLimitingFactorMln(regionalData) {
        if (!regionalData) return 'Insufficient Data';
        
        const waterH2 = parseFloat(this.calculateH2FromWaterMln(regionalData));
        const energyH2 = parseFloat(this.calculateH2FromEnergy(regionalData));
        
        if (isNaN(waterH2) || waterH2 === 0) return '💧 Water Limited (No Water Data)';
        if (isNaN(energyH2) || energyH2 === 0) return '⚡ Energy Limited (No Energy Data)';
        
        if (waterH2 < energyH2) {
            return '💧 Water Limited';
        } else {
            return '⚡ Energy Limited';
        }
    },
        // Keep original for backward compatibility
    determineLimitingFactor(regionalData) {
        return this.determineLimitingFactorMln(regionalData);
    },


    // Add WMA popup handler
    showWMAPopup(data, latlng) {
        const popup = document.getElementById('info-popup');
        const title = document.getElementById('popup-title');
        const content = document.getElementById('popup-content');
        
        // Use river_names as the title
        title.textContent = data.river_names || t('popup.waterManagementArea');
        
        // Map classification to readable text with icons
        const classificationText = {
            'available': '💧💧💧 High Volume Available',
            'high available water': '💧💧💧 High Volume Available',
            'medium available water': '💧💧 Medium Availability',
            'less available water': '💧 Limited Availability',
            'no available water': '⚠️ No Water Available',
            'no data': '❓ No Data Available'
        };
        
        // Get the classification display text
        let displayClassification = classificationText['no data'];
        const classification = (data.classification || '').toLowerCase();
        Object.keys(classificationText).forEach(key => {
            if (classification.includes(key)) {
                displayClassification = classificationText[key];
            }
        });
        
        const html = `
            <div class="popup-section">
                <div class="popup-section-title">${t('popup.waterManagementAreaDetails')}</div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.waterSource')}:</span>
                    <span class="popup-metric-value">${data.river_names || t('popup.unknownValue')}</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.region')}:</span>
                    <span class="popup-metric-value">${I18n.regionName(data.NAME_1) || t('results.nA')}</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">${t('popup.waterAvailability')}:</span>
                    <span class="popup-metric-value">${displayClassification}</span>
                </div>
                ${data.ID ? `
                ` : ''}
            </div>
            <div class="popup-section">
                <div class="popup-section-title">${t('popup.assessmentStatus')}</div>
                <div style="padding: 10px; background: #e3f2fd; border-radius: 4px; border-left: 3px solid #1976d2;">
                    <strong>${t('popup.note')}:</strong> ${t('popup.wmaAssessmentNote', { region: I18n.regionName(data.NAME_1), source: data.river_names })}
                </div>
            </div>
        `;
        
        content.innerHTML = html;
        this.positionPopup(popup, latlng);
        popup.style.display = 'block';
    },
    // Add these functions to popupManager.js:

    // Helper functions for CO2 storage
    formatStorageType(type) {
        const types = {
            'depleted_field': 'Depleted Gas Field',
            'saline_aquifer': 'Saline Aquifer',
            'oil_field': 'Depleted Oil Field'
        };
        return types[type] || type || 'Saline Aquifer';
    },

    formatStatus(status) {
        const statuses = {
            'operational': '🟢 Operational',
            'development': '🟡 In Development',
            'potential': '🔵 Potential Site'
        };
        return statuses[status] || status || '🔵 Potential Site';
    },

    calculateH2FromCO2Storage(capacityMt) {
        // Assuming 9 kg CO2 captured per kg H2 produced in SMR with CCS
        // And assuming 20-year project lifetime
        return ((capacityMt * 1000) / 9 / 20).toFixed(0); // kt H2/year
    },

    calculateStorageLifetime(capacityMt) {
        // Assuming 100 MW blue H2 plant with 90% capture
        // ~200 kt CO2/year captured
        return (capacityMt * 1000 / 200).toFixed(0);
    },

    // Update the initializeCharts function to add storage chart
    createStorageChart(data) {
        const ctx = document.getElementById('storage-chart');
        if (!ctx) return;
        
        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Capacity', 'Area', 'Thickness'],
                datasets: [{
                    label: 'Storage Parameters',
                    data: [
                        data.storage_capacity_mt || data.capacity_mtco2 || 0,
                        (data.area_km2 || 0) / 10, // Scale for visualization
                        (data.thickness_m || 0) / 10 // Scale for visualization
                    ],
                    backgroundColor: ['#795548', '#8d6e63', '#a1887f']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const labels = ['Mt CO₂', 'km² (×10)', 'm (×10)'];
                                return `${context.parsed.y.toFixed(1)} ${labels[context.dataIndex]}`;
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    },

    // Normalized (KZ = 100) bars + dashed 100% baseline
    createRegionResourcesChart(canvasEl, regionalData) {
    if (!canvasEl || !regionalData) return;
    const ctx = (canvasEl.getContext ? canvasEl : document.getElementById(canvasEl))?.getContext('2d');
    if (!ctx) return;

    // Kazakhstan baselines
    const KZ = { pvout: 1363, wpd: 602, ws: 8.27 };

    // number -> finite or 0
    const num0 = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };

    // Region raw values (keys used in your popup)
    const rPV  = num0(regionalData.pvout_kwh_kwp_yr);
    const rWPD = num0(regionalData.wpd_w_m2_10pct);
    const rWS  = num0(regionalData.ws_m_s_10pct);

    // Normalize to KZ = 100
    const regIdx = [
        KZ.pvout ? (rPV  / KZ.pvout) * 100 : 0,
        KZ.wpd   ? (rWPD / KZ.wpd)   * 100 : 0,
        KZ.ws    ? (rWS  / KZ.ws)    * 100 : 0
    ].map(v => Math.max(0, v));

    const labels = [t('popup.pvOutput'), t('popup.windPowerDensity'), t('popup.meanWindSpeed')];

    // Clean up previous instance
    window.popupCharts ??= {};
    window.popupCharts.regionResources?.destroy?.();

    // Colors per bar (PVout, WPD, MWS)
    const BAR_COLORS = ['#f6c90e', '#0d47a1', '#b71c1c']; // yellow, dark blue, dark red

    window.popupCharts.regionResources = new Chart(ctx, {
        type: 'bar',
        data: {
        labels,
        datasets: [
            // Region bars (each bar its own color)
            {
            label: t('popup.regionBaseline'),
            data: regIdx,
            backgroundColor: BAR_COLORS,
            borderRadius: 4
            },
            // 100% KZ baseline (dashed line)
            {
            type: 'line',
            label: t('popup.kazakhstanBaseline'),
            data: [100, 100, 100],
            borderColor: '#6b7280',   // neutral gray
            borderDash: [6, 6],
            borderWidth: 2,
            pointRadius: 0,
            fill: false
            }
        ]
        },
        options: {
        responsive: true,
        maintainAspectRatio: false,     // make sure parent gives a fixed height
        animation: false,
        resizeDelay: 150,
        plugins: {
            legend: { position: 'bottom' },
            tooltip: {
            callbacks: {
                // Show both normalized % and raw values
                label: (c) => {
                if (c.dataset.type === 'line') return t('popup.kazakhstanTooltip');
                const i = c.dataIndex;
                const raw = [rPV, rWPD, rWS][i];
                const units = ['kWh/kWp/yr', 'W/m2', 'm/s'][i];
                return `${c.label}: ${c.parsed.y.toFixed(0)}% of KZ (${t('popup.regionValue')} = ${raw.toFixed(2)} ${units})`;
                }
            }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            y: {
            min: 0,
            // Give headroom above the taller of 100% or region bars
            suggestedMax: Math.max(120, Math.ceil(Math.max(...regIdx, 100) / 20) * 20),
            grid: { color: '#eee' },
            ticks: { display: false } // hide y-axis numbers
            }
        }
        }
    });
    },
    // helper: finite number or 0
    num0(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; },

    getResourceChartLabels() {
        return [t('popup.pvOutput'), t('popup.windPowerDensity'), t('popup.meanWindSpeed')];
    },

    getRegionBaselineLabel() {
        return t('popup.regionBaseline');
    },

    getKazakhstanBaselineLabel() {
        return t('popup.kazakhstanBaseline');
    },

    getKazakhstanTooltipLabel() {
        return t('popup.kazakhstanTooltip');
    },

    getRegionValueLabel() {
        return t('popup.regionValue');
    },

    // Apples-to-apples normalized comparison (KZ = 100) with dashed 100% line
    createRegionCompareIndexChart(regionalData) {
    const el = document.getElementById('region-compare-chart');
    if (!el) return;
    const ctx = el.getContext('2d');

    // Kazakhstan baseline
    const KZ = { pvout: 1363, wpd: 602, ws: 8.27 };

    // Region values (use your keys)
    const rPV  = this.num0(regionalData?.pvout_kwh_kwp_yr);
    const rWPD = this.num0(regionalData?.wpd_w_m2_10pct);
    const rWS  = this.num0(regionalData?.ws_m_s_10pct);

    // Normalize to KZ = 100
    const regIdx = [
        KZ.pvout ? (rPV  / KZ.pvout) * 100 : 0,
        KZ.wpd   ? (rWPD / KZ.wpd)   * 100 : 0,
        KZ.ws    ? (rWS  / KZ.ws)    * 100 : 0
    ].map(v => Math.max(0, v));

    const labels = this.getResourceChartLabels();
    const BAR_COLORS = ['#f6c90e', '#0d47a1', '#b71c1c']; // yellow, dark blue, dark red

    window.popupCharts ??= {};
    window.popupCharts.regionCompare?.destroy?.();

    window.popupCharts.regionCompare = new Chart(ctx, {
        type: 'bar',
        data: {
        labels,
        datasets: [
            {
            label: this.getRegionBaselineLabel(),
            data: regIdx,
            backgroundColor: BAR_COLORS,
            borderRadius: 4
            },
            {
            type: 'line',
            label: this.getKazakhstanBaselineLabel(),
            data: [100, 100, 100],
            borderColor: '#6b7280',
            borderDash: [6, 6],
            borderWidth: 2,
            pointRadius: 0,
            fill: false
            }
        ]
        },
        options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        resizeDelay: 150,
        plugins: {
            legend: { position: 'bottom' },
            tooltip: {
            callbacks: {
                label: (c) => {
                if (c.dataset.type === 'line') return this.getKazakhstanTooltipLabel();
                const raw = [rPV, rWPD, rWS][c.dataIndex];
                const units = ['kWh/kWp/yr', 'W/m2', 'm/s'][c.dataIndex];
                return `${c.label}: ${c.parsed.y.toFixed(0)}% of KZ (${this.getRegionValueLabel()} = ${raw.toFixed(2)} ${units})`;
                }
            }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            y: {
            min: 0,
            suggestedMax: Math.max(120, Math.ceil(Math.max(...regIdx, 100) / 20) * 20),
            grid: { color: '#eee' },
            ticks: { display: false } // hide y-axis numbers
            }
        }
        }
    });
    },

    // Water resources pie (auto-hides zero/empty slices)
    createRegionWaterChart(regionalData) {
    const el = document.getElementById('region-water-chart');
    if (!el) return;
    const ctx = el.getContext('2d');

    const slices = [
        { label: t('popup.freshwater'),  value: this.num0(regionalData?.freshwater_mln_m3)  },
        { label: t('popup.groundwater'), value: this.num0(regionalData?.groundwater_mln_m3) },
        { label: t('popup.brackishWater'),    value: this.num0(regionalData?.brackish_water_mln_m3) },
        { label: t('popup.treatedWastewater'),  value: this.num0(regionalData?.wastewater_mln_m3) }
    ].filter(s => s.value > 0);

    if (!slices.length) return;

    window.popupCharts ??= {};
    window.popupCharts.regionWater?.destroy?.();

    window.popupCharts.regionWater = new Chart(ctx, {
        type: 'pie',
        data: {
        labels: slices.map(s => s.label),
        datasets: [{ data: slices.map(s => s.value) }]
        },
        options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { position: 'bottom' } }
        }
    });
    },
    // Show pipeline popup
    showPipelinePopup(pipelineInfo, latlng) {
        const popup = document.getElementById('info-popup');
        const title = document.getElementById('popup-title');
        const content = document.getElementById('popup-content');
        
        // Set title
        title.textContent = pipelineInfo.name;
        
        // Generate content
        const html = `
            <div class="popup-section">
                <div class="popup-section-title">Pipeline Information</div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Type:</span>
                    <span class="popup-metric-value">${pipelineInfo.type.toUpperCase()}</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Diameter:</span>
                    <span class="popup-metric-value">${pipelineInfo.diameter} mm</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Capacity:</span>
                    <span class="popup-metric-value">${pipelineInfo.capacity} BCM/year</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Length:</span>
                    <span class="popup-metric-value">${pipelineInfo.length} km</span>
                </div>
                ${pipelineInfo.stations ? `
                <div class="popup-metric">
                    <span class="popup-metric-label">Route:</span>
                    <span class="popup-metric-value" style="font-size: 11px;">${pipelineInfo.stations}</span>
                </div>
                ` : ''}
            </div>
            <div class="popup-section">
                <div class="popup-section-title">Transport Capacity</div>
                <div class="popup-metric">
                    <span class="popup-metric-label">H₂ Equivalent:</span>
                    <span class="popup-metric-value">${this.calculateH2Equivalent(pipelineInfo.capacity)} kt H₂/year</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Energy Flow:</span>
                    <span class="popup-metric-value">${(pipelineInfo.capacity * 10.5).toFixed(1)} TWh/year</span>
                </div>
            </div>
        `;
        
        content.innerHTML = html;
        
        // Position and show popup
        this.positionPopup(popup, latlng);
        popup.style.display = 'block';
    },

    // Add this to popupManager.js for export point popups

    showExportPopup(point, latlng) {
        const popup = document.getElementById('info-popup');
        const title = document.getElementById('popup-title');
        const content = document.getElementById('popup-content');
        
        // Set title
        title.textContent = point.name || 'H₂ Export Terminal';
        
        // Generate content
        const html = `
            <div class="popup-section">
                <div class="popup-section-title">Export Corridor Details</div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Destination Market:</span>
                    <span class="popup-metric-value">${point.export_destination || 'International'}</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Transport Mode:</span>
                    <span class="popup-metric-value">${point.transport_mode || 'Pipeline/Ship'}</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Port/Terminal:</span>
                    <span class="popup-metric-value">${point.port_name || point.name}</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Distance to Market:</span>
                    <span class="popup-metric-value">${point.distance_km || 'N/A'} km</span>
                </div>
            </div>
            <div class="popup-section">
                <div class="popup-section-title">Export Capacity</div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Current H₂ Export:</span>
                    <span class="popup-metric-value">${point.current_h2_demand_kt_year || 0} kt/year</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Potential H₂ Export:</span>
                    <span class="popup-metric-value">${point.potential_h2_demand_kt_year || 1000} kt/year</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Target Year:</span>
                    <span class="popup-metric-value">${point.target_year || 2030}</span>
                </div>
            </div>
            <div class="popup-section">
                <div class="popup-section-title">Market Analysis</div>
                <div class="popup-metric">
                    <span class="popup-metric-label">H₂ Price (delivered):</span>
                    <span class="popup-metric-value">$${point.delivered_price || 5}/kg</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Transport Cost:</span>
                    <span class="popup-metric-value">$${point.transport_cost || 1.5}/kg</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Market Size:</span>
                    <span class="popup-metric-value">${point.market_size_mt || 10} Mt/year</span>
                </div>
            </div>
        `;
        
        content.innerHTML = html;
        
        // Position and show popup
        this.positionPopup(popup, latlng);
        popup.style.display = 'block';
        
        // Create export economics chart
        setTimeout(() => {
            this.createExportChart(point);
        }, 100);
    },

    // Show station popup
    showStationPopup(station, latlng) {
        const popup = document.getElementById('info-popup');
        const title = document.getElementById('popup-title');
        const content = document.getElementById('popup-content');
        
        // Set title
        title.textContent = station.ps_name || 'Pipeline Station';
        
        // Generate content
        const html = `
            <div class="popup-section">
                <div class="popup-section-title">Station Details</div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Location:</span>
                    <span class="popup-metric-value">${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}</span>
                </div>
                <div class="popup-metric">
                    <span class="popup-metric-label">Pipeline Group:</span>
                    <span class="popup-metric-value">Group ${station.group}</span>
                </div>
                ${station.type ? `
                <div class="popup-metric">
                    <span class="popup-metric-label">Type:</span>
                    <span class="popup-metric-value">${station.type.toUpperCase()}</span>
                </div>
                ` : ''}
                ${station.capacity_bcm_year ? `
                <div class="popup-metric">
                    <span class="popup-metric-label">Capacity:</span>
                    <span class="popup-metric-value">${station.capacity_bcm_year} BCM/year</span>
                </div>
                ` : ''}
            </div>
        `;
        
        content.innerHTML = html;
        
        // Position and show popup
        this.positionPopup(popup, latlng);
        popup.style.display = 'block';
    },

    // Calculate H2 equivalent from natural gas
    calculateH2Equivalent(gasBcm) {
        // Rough calculation: 1 BCM natural gas can produce ~90 kt H2 via SMR
        return (gasBcm * 90).toFixed(0);
    }
};
