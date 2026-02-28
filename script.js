"use strict";
document.addEventListener('DOMContentLoaded', () => {
    const amountInput = document.getElementById('amount');
    const baseValue = document.getElementById('base-amount');
    const ivaValue = document.getElementById('iva-amount');
    const totalValue = document.getElementById('total-amount');
    const calcMode = document.getElementById('calc-mode');
    const inputLabel = document.getElementById('input-label');
    const modeTotalLabel = document.getElementById('mode-total');
    const modeBaseLabel = document.getElementById('mode-base');
    const rateChips = document.querySelectorAll('.rate-chip');
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
    let ivaRate = 0.19;
    let retRate = 0.10;
    let reteicaRate = 0.0069;
    let autoSaveTimer;
    let lastSavedCalc = "";
    function updateLabels() {
        const isGrossUp = expertToggle.checked && grossUpToggle && grossUpToggle.checked;
        if (isGrossUp) {
            inputLabel.textContent = "Monto Neto a Pagar Libre (COP)";
            calcMode.disabled = true;
            const modeToggleElement = document.querySelector('.mode-toggle');
            if (modeToggleElement) modeToggleElement.style.opacity = '0.5';
        } else {
            calcMode.disabled = false;
            const modeToggleElement = document.querySelector('.mode-toggle');
            if (modeToggleElement) modeToggleElement.style.opacity = '1';
            if (calcMode.checked) {
                inputLabel.textContent = "Monto Base (COP)";
                modeBaseLabel.classList.add('active');
                modeTotalLabel.classList.remove('active');
            }
            else {
                inputLabel.textContent = "Monto Total (COP)";
                modeTotalLabel.classList.add('active');
                modeBaseLabel.classList.remove('active');
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
            base = inputValue / effectiveRate;
            iva = base * ivaRate;
            totalBruto = base + iva;
        } else if (!calcMode.checked) {
            // "Desglosar" Mode: Input is TOTAL BRUTO (Base + IVA)
            totalBruto = inputValue;
            base = totalBruto / (1 + ivaRate);
            iva = totalBruto - base;
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
        // Auto-save logic
        clearTimeout(autoSaveTimer);
        if (inputValue > 0) {
            autoSaveTimer = setTimeout(() => {
                const currentCalc = `${inputValue}-${calcMode.checked}-${ivaRate}-${retRate}-${reteicaRate}`;
                if (currentCalc !== lastSavedCalc) {
                    const item = {
                        input: amountInput.value,
                        total: formatCurrency(finalTotal),
                        mode: !calcMode.checked ? 'total' : 'base',
                        ret: retAmount > 0 || reteivaAmount > 0 || reteicaAmount > 0,
                        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    saveToHistory(item);
                    lastSavedCalc = currentCalc;
                }
            }, 2000);
        }
    }
    calcMode.addEventListener('change', () => {
        updateLabels();
        calculateIVA();
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
            historyList.innerHTML = '<p class="empty-msg">No hay cálculos guardados.</p>';
            return;
        }
        historyList.innerHTML = '';
        history.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="hist-info">
                    <span>${item.mode === 'total' ? 'Desglose' : 'Suma'} - ${item.input}</span>
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
        let textToCopy = `NetoApp - Cálculo de IVA y Retenciones\n`;
        textToCopy += `-----------------------------------\n`;
        textToCopy += `Modo: ${!calcMode.checked ? 'Desglosar (de Total)' : 'Sumar (a Base)'}\n`;
        textToCopy += `Base Gravable: ${baseRaw}\n`;
        textToCopy += `IVA (${ivaRate * 100}%): ${ivaRaw}\n`;
        if (expertToggle.checked) {
            textToCopy += `Total Bruto (Factura): ${totalBrutoValue ? totalBrutoValue.textContent : ''}\n`;
            if (retRate > 0)
                textToCopy += `Retención Fuente (${retRate * 100}%): ${retentionValue.textContent}\n`;
            if (reteivaToggle.checked)
                textToCopy += `ReteIVA (15% del IVA): ${reteivaValue.textContent}\n`;
            if (reteicaRate > 0)
                textToCopy += `ReteICA (${(reteicaRate * 100).toFixed(3)}%): ${reteicaValue.textContent}\n`;
            textToCopy += `Total a Pagar (Neto): ${totalRaw}\n`;
        }
        else {
            textToCopy += `Total: ${totalRaw}\n`;
        }
        textToCopy += `-----------------------------------`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.classList.add('copied');
            const copySpan = copyBtn.querySelector('span');
            if (copySpan)
                copySpan.textContent = '¡Copiado!';
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = originalText;
            }, 2000);
        });
    });
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
