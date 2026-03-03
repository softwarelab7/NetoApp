"use strict";
document.addEventListener('DOMContentLoaded', () => {
    const amountInput = document.getElementById('amount');
    const baseValue = document.getElementById('base-amount');
    const ivaValue = document.getElementById('iva-amount');
    const totalValue = document.getElementById('total-amount');
    const inputLabel = document.getElementById('input-label');
    const rateChips = document.querySelectorAll('.rate-chip');
    const modeChips = document.querySelectorAll('.mode-chip');
    let currentMode = 'base'; // 'base', 'total', 'iva'
    const expertToggle = document.getElementById('expert-toggle');
    const expertPanel = document.getElementById('expert-panel');
    const grossUpToggle = document.getElementById('gross-up-toggle');
    const retChips = document.querySelectorAll('.ret-chip');
    const retentionRow = document.getElementById('retention-row');
    const reteivaRow = document.getElementById('reteiva-row');
    const retentionValue = document.getElementById('retention-amount');
    const reteivaValue = document.getElementById('reteiva-amount');
    const reteicaRow = document.getElementById('reteica-row');
    const reteicaValue = document.getElementById('reteica-amount');
    const reteicaChips = document.querySelectorAll('.reteica-chip');
    const totalLabel = document.getElementById('total-label');
    const totalBrutoRow = document.getElementById('total-bruto-row');
    const totalBrutoValue = document.getElementById('total-bruto-amount');
    let ivaRate = 0;
    let retRate = 0.10;
    let reteicaRate = 0;
    let autoSaveTimer;
    let lastSavedCalc = "";
    function updateLabels() {
        const isGrossUp = expertToggle.checked && grossUpToggle && grossUpToggle.checked;
        const modeToggleElement = document.getElementById('calc-mode-group');

        if (isGrossUp) {
            inputLabel.textContent = "Monto Neto a Pagar Libre (COP)";
            if (modeToggleElement) {
                modeToggleElement.style.opacity = '0.5';
                modeToggleElement.style.pointerEvents = 'none';
            }
        } else {
            if (modeToggleElement) {
                modeToggleElement.style.opacity = '1';
                modeToggleElement.style.pointerEvents = 'auto';
            }
            if (currentMode === 'base') {
                inputLabel.textContent = "Monto Base (COP)";
            } else if (currentMode === 'total') {
                inputLabel.textContent = "Monto Total (COP)";
            } else if (currentMode === 'iva') {
                inputLabel.textContent = "Valor del IVA (COP)";
            }
        }
    }

    if (grossUpToggle) {
        grossUpToggle.addEventListener('change', () => {
            updateLabels();
            calculateIVA();
        });
    }

    expertToggle.addEventListener('change', () => {
        expertPanel.classList.toggle('hidden', !expertToggle.checked);
        updateLabels();
        calculateIVA();
    });
    retChips.forEach(chip => {
        chip.addEventListener('click', () => {
            retChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            retRate = parseFloat(chip.dataset.ret || "0");
            calculateIVA();
        });
    });
    reteicaChips.forEach(chip => {
        chip.addEventListener('click', () => {
            reteicaChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            reteicaRate = parseFloat(chip.dataset.rate || "0");
            calculateIVA();
        });
    });
    rateChips.forEach(chip => {
        chip.addEventListener('click', () => {
            rateChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            ivaRate = parseFloat(chip.dataset.rate || "0");
            const infoP = document.querySelector('.info-box p');
            if (infoP)
                infoP.textContent = `Tarifa seleccionada: ${ivaRate * 100}%`;
            calculateIVA();
        });
    });
    function formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 2
        }).format(amount);
    }
    function formatInput(value) {
        let rawValue = value.replace(/\D/g, '');
        if (!rawValue)
            return '';
        return rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    function calculateIVA() {
        const rawValue = amountInput.value.replace(/\./g, '');
        const inputValue = parseFloat(rawValue) || 0;
        let base, iva, totalBruto, finalTotal;
        let retAmount = 0;
        let reteivaAmount = 0;
        let reteicaAmount = 0;
        const isGrossUp = expertToggle.checked && grossUpToggle && grossUpToggle.checked;
        if (isGrossUp) {
            let effectiveRate = 1 + ivaRate - retRate - reteicaRate;
            base = Math.ceil(inputValue / effectiveRate);
            iva = Math.ceil(base * ivaRate);
            totalBruto = base + iva;
        } else if (currentMode === 'total') {
            // Input is TOTAL BRUTO (Base + IVA)
            totalBruto = inputValue;
            base = totalBruto / (1 + ivaRate);
            iva = totalBruto - base;
        } else if (currentMode === 'iva') {
            // Input is IVA itself
            if (ivaRate === 0) {
                if (inputValue > 0 && document.activeElement === amountInput) {
                    showToast('No se puede calcular desde IVA con tarifa del 0%', 'error');
                }
                base = 0; iva = 0; totalBruto = 0;
            } else {
                iva = inputValue;
                base = iva / ivaRate;
                totalBruto = base + iva;
            }
        }
        else {
            // "Sumar" Mode: Input is BASE
            base = inputValue;
            iva = base * ivaRate;
            totalBruto = base + iva;
        }
        finalTotal = totalBruto;
        if (expertToggle.checked) {
            retAmount = base * retRate;
            reteicaAmount = base * reteicaRate;
            finalTotal = totalBruto - retAmount - reteivaAmount - reteicaAmount;
            if (totalBrutoRow) totalBrutoRow.classList.remove('hidden');
            if (totalBrutoValue) totalBrutoValue.textContent = formatCurrency(totalBruto);
            retentionRow.classList.remove('hidden');
            reteicaRow.classList.remove('hidden');

            // hide reteiva entirely as it was removed from expert UI mode by user request
            reteivaRow.classList.add('hidden');
            retentionValue.textContent = formatCurrency(retAmount);
            reteicaValue.textContent = formatCurrency(reteicaAmount);
            totalLabel.textContent = "Total a Pagar (Neto):";
        }
        else {
            if (totalBrutoRow) totalBrutoRow.classList.add('hidden');
            retentionRow.classList.add('hidden');
            reteivaRow.classList.add('hidden');
            reteicaRow.classList.add('hidden');
            totalLabel.textContent = "Total:";
        }
        const ivaLabel = document.querySelector('.result-item:nth-child(2) .label');
        if (ivaLabel)
            ivaLabel.textContent = `IVA (${ivaRate * 100}%):`;
        baseValue.textContent = formatCurrency(base);
        ivaValue.textContent = formatCurrency(iva);
        totalValue.textContent = formatCurrency(finalTotal);

        // Trigger CSS animation for value updates
        const resultValues = [baseValue, ivaValue, totalValue];
        if (expertToggle.checked) {
            resultValues.push(retentionValue, reteicaValue);
            if (totalBrutoValue) resultValues.push(totalBrutoValue);
        }

        resultValues.forEach(el => {
            el.classList.remove('value-update');
            // Trigger reflow to restart animation
            void el.offsetWidth;
            el.classList.add('value-update');
        });
        // Auto-save logic
        clearTimeout(autoSaveTimer);
        if (inputValue > 0) {
            autoSaveTimer = setTimeout(() => {
                const currentCalc = `${inputValue}-${currentMode}-${ivaRate}-${retRate}-${reteicaRate}`;
                if (currentCalc !== lastSavedCalc) {
                    const item = {
                        input: amountInput.value,
                        total: formatCurrency(finalTotal),
                        mode: currentMode,
                        ret: retAmount > 0 || reteivaAmount > 0 || reteicaAmount > 0,
                        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    saveToHistory(item);
                    lastSavedCalc = currentCalc;
                }
            }, 2000);
        }
    }

    modeChips.forEach(chip => {
        chip.addEventListener('click', () => {
            modeChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentMode = chip.dataset.mode;
            updateLabels();
            calculateIVA();
        });
    });
    const copyBtn = document.getElementById('copy-btn');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');
    // Load history on start
    renderHistory();
    function getHistory() {
        const history = localStorage.getItem('iva_history');
        return history ? JSON.parse(history) : [];
    }
    function saveToHistory(item) {
        let history = getHistory();
        history.unshift(item); // Add to beginning
        history = history.slice(0, 5); // Keep last 5
        localStorage.setItem('iva_history', JSON.stringify(history));
        renderHistory();
    }
    function renderHistory() {
        if (!historyList)
            return;
        const history = getHistory();
        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-msg" style="display:flex; flex-direction:column; align-items:center; gap:8px; opacity:0.6;">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <p style="margin:0;">No hay cálculos guardados</p>
                    <small style="font-size:11px;">Tus cálculos recientes aparecerán aquí</small>
                </div>
            `;
            return;
        }
        historyList.innerHTML = '';
        history.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'history-item';

            let modeDisplay = '';
            if (item.mode === 'base') modeDisplay = 'Desde Base';
            else if (item.mode === 'total') modeDisplay = 'Desde Total';
            else if (item.mode === 'iva') modeDisplay = 'Desde IVA';

            div.innerHTML = `
                <div class="hist-info">
                    <span>${modeDisplay} - ${item.input}</span>
                    <small>${item.date}</small>
                </div>
                <div class="hist-total">${item.total}</div>
            `;
            historyList.appendChild(div);
        });
    }
    amountInput.addEventListener('input', (e) => {
        const target = e.target;
        // Save cursor position if needed (though for currency it can be tricky)
        const start = target.selectionStart || 0;
        const oldLength = target.value.length;
        const formatted = formatInput(target.value);
        target.value = formatted;
        // Adjust cursor position
        const newLength = formatted.length;
        target.setSelectionRange(start + (newLength - oldLength), start + (newLength - oldLength));
        calculateIVA();
    });
    copyBtn.addEventListener('click', () => {
        const rawValue = amountInput.value.replace(/\./g, '');
        const inputValue = parseFloat(rawValue) || 0;
        const totalRaw = totalValue.textContent;
        const baseRaw = baseValue.textContent;
        const ivaRaw = ivaValue.textContent;

        let modeDisplay = '';
        if (currentMode === 'base') modeDisplay = 'Desde Monto Base';
        else if (currentMode === 'total') modeDisplay = 'Desde Monto Total';
        else if (currentMode === 'iva') modeDisplay = 'Desde Valor del IVA';

        let textToCopy = `NetoApp - Cálculo de IVA y Retenciones\n`;
        textToCopy += `-----------------------------------\n`;
        textToCopy += `Modo: ${modeDisplay}\n`;
        textToCopy += `Base Gravable: ${baseRaw}\n`;
        textToCopy += `IVA (${ivaRate * 100}%): ${ivaRaw}\n`;
        if (expertToggle.checked) {
            textToCopy += `Total Bruto (Factura): ${totalBrutoValue ? totalBrutoValue.textContent : ''}\n`;
            if (retRate > 0)
                textToCopy += `Retención Fuente (${retRate * 100}%): ${retentionValue.textContent}\n`;
            if (reteicaRate > 0)
                textToCopy += `ReteICA (${(reteicaRate * 100).toFixed(3)}%): ${reteicaValue.textContent}\n`;
            textToCopy += `Total a Pagar (Neto): ${totalRaw}\n`;
        }
        else {
            textToCopy += `Total: ${totalRaw}\n`;
        }
        textToCopy += `-----------------------------------`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast('¡Resultados copiados al portapapeles!', 'success');
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.classList.remove('copied');
            }, 2000);
        });
    });

    // Toast Notification System
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // Add icon based on type
        let iconHtml = '';
        if (type === 'success') {
            iconHtml = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else {
            iconHtml = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }

        toast.innerHTML = `${iconHtml}<span>${message}</span>`;
        container.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300); // Wait for exit animation
        }, 3000);
    }
    const themeToggle = document.getElementById('theme-toggle');
    // Theme initialization
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark');
    }
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const theme = document.body.classList.contains('dark') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    });
    clearHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem('iva_history');
        renderHistory();
    });
    // PWA Service Worker Registration & Update Logic
    let newWorker = null;
    const updateToast = document.getElementById('update-toast');
    const updateBtn = document.getElementById('update-btn');
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then(reg => {
                console.log('SW Registered', reg);
                reg.addEventListener('updatefound', () => {
                    newWorker = reg.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker?.state === 'installed' && navigator.serviceWorker.controller) {
                                // New update available, show popup
                                if (updateToast)
                                    updateToast.classList.remove('hidden');
                            }
                        });
                    }
                });
            }).catch(err => console.log('SW Registration Failed', err));
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    window.location.reload();
                    refreshing = true;
                }
            });
        });
    }
    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            if (newWorker) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
        });
    }
    // Color Theme Logic
    const themeMenuBtn = document.getElementById('theme-menu-btn');
    const themeDropdown = document.getElementById('theme-dropdown');
    const themeSwatches = document.querySelectorAll('.theme-swatch');
    // Toggle dropdown
    themeMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        themeDropdown.classList.toggle('show');
    });
    // Close on click outside
    document.addEventListener('click', () => {
        themeDropdown.classList.remove('show');
    });
    // Handle theme change
    themeSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            const theme = swatch.dataset.theme || 'default';
            applyTheme(theme);
            themeDropdown.classList.remove('show');
        });
    });
    function applyTheme(theme) {
        // Remove all theme classes
        document.body.classList.remove('theme-emerald', 'theme-ruby', 'theme-amber', 'theme-violet', 'theme-pink');
        // Add new one if not default
        if (theme !== 'default') {
            document.body.classList.add(theme);
        }
        // Update active swatch
        themeSwatches.forEach(s => {
            s.classList.toggle('active', s.dataset.theme === theme);
        });
        // Save preference
        localStorage.setItem('netoapp_color_theme', theme);
    }
    // Load saved theme
    const savedTheme = localStorage.getItem('netoapp_color_theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    }
});
