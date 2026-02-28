interface HistoryItem {
    input: string;
    total: string;
    mode: 'total' | 'base';
    ret: boolean;
    date: string;
}

document.addEventListener('DOMContentLoaded', () => {
    const amountInput = document.getElementById('amount') as HTMLInputElement;
    const baseValue = document.getElementById('base-amount') as HTMLElement;
    const ivaValue = document.getElementById('iva-amount') as HTMLElement;
    const totalValue = document.getElementById('total-amount') as HTMLElement;

    const calcMode = document.getElementById('calc-mode') as HTMLInputElement;
    const inputLabel = document.getElementById('input-label') as HTMLElement;
    const modeTotalLabel = document.getElementById('mode-total') as HTMLElement;
    const modeBaseLabel = document.getElementById('mode-base') as HTMLElement;

    const rateChips = document.querySelectorAll('.rate-chip') as NodeListOf<HTMLElement>;

    const expertToggle = document.getElementById('expert-toggle') as HTMLInputElement;
    const expertPanel = document.getElementById('expert-panel') as HTMLElement;
    const retChips = document.querySelectorAll('.ret-chip') as NodeListOf<HTMLElement>;
    const reteivaToggle = document.getElementById('reteiva-toggle') as HTMLInputElement;
    const retentionRow = document.getElementById('retention-row') as HTMLElement;
    const reteivaRow = document.getElementById('reteiva-row') as HTMLElement;
    const retentionValue = document.getElementById('retention-amount') as HTMLElement;
    const reteivaValue = document.getElementById('reteiva-amount') as HTMLElement;
    const reteicaRow = document.getElementById('reteica-row') as HTMLElement;
    const reteicaValue = document.getElementById('reteica-amount') as HTMLElement;
    const reteicaChips = document.querySelectorAll('.reteica-chip') as NodeListOf<HTMLElement>;
    const totalLabel = document.getElementById('total-label') as HTMLElement;

    let ivaRate: number = 0.19;
    let retRate: number = 0;
    let reteicaRate: number = 0;
    let autoSaveTimer: ReturnType<typeof setTimeout>;
    let lastSavedCalc: string = "";

    expertToggle.addEventListener('change', () => {
        expertPanel.classList.toggle('hidden', !expertToggle.checked);
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

    reteivaToggle.addEventListener('change', calculateIVA);

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
            if (infoP) infoP.textContent = `Tarifa seleccionada: ${ivaRate * 100}%`;
            calculateIVA();
        });
    });

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 2
        }).format(amount);
    }

    function formatInput(value: string): string {
        let rawValue = value.replace(/\D/g, '');
        if (!rawValue) return '';
        return rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    function calculateIVA() {
        const rawValue = amountInput.value.replace(/\./g, '');
        const inputValue = parseFloat(rawValue) || 0;

        let base: number, iva: number, totalBruto: number, finalTotal: number;
        let retAmount: number = 0;
        let reteivaAmount: number = 0;
        let reteicaAmount: number = 0;

        if (!calcMode.checked) {
            // "Desglosar" Mode: Input is TOTAL BRUTO (Base + IVA)
            totalBruto = inputValue;
            base = totalBruto / (1 + ivaRate);
            iva = totalBruto - base;
        } else {
            // "Sumar" Mode: Input is BASE
            base = inputValue;
            iva = base * ivaRate;
            totalBruto = base + iva;
        }

        finalTotal = totalBruto;

        if (expertToggle.checked) {
            retAmount = base * retRate;
            if (reteivaToggle.checked) {
                reteivaAmount = iva * 0.15;
            }
            reteicaAmount = base * reteicaRate;
            finalTotal = totalBruto - retAmount - reteivaAmount - reteicaAmount;

            retentionRow.classList.toggle('hidden', retAmount === 0);
            reteivaRow.classList.toggle('hidden', reteivaAmount === 0);
            reteicaRow.classList.toggle('hidden', reteicaAmount === 0);
            retentionValue.textContent = formatCurrency(retAmount);
            reteivaValue.textContent = formatCurrency(reteivaAmount);
            reteicaValue.textContent = formatCurrency(reteicaAmount);
            totalLabel.textContent = "Total a Pagar (Neto):";
        } else {
            retentionRow.classList.add('hidden');
            reteivaRow.classList.add('hidden');
            reteicaRow.classList.add('hidden');
            totalLabel.textContent = "Total:";
        }

        const ivaLabel = document.querySelector('.result-item:nth-child(2) .label');
        if (ivaLabel) ivaLabel.textContent = `IVA (${ivaRate * 100}%):`;

        baseValue.textContent = formatCurrency(base);
        ivaValue.textContent = formatCurrency(iva);
        totalValue.textContent = formatCurrency(finalTotal);

        // Auto-save logic
        clearTimeout(autoSaveTimer);
        if (inputValue > 0) {
            autoSaveTimer = setTimeout(() => {
                const currentCalc = `${inputValue}-${calcMode.checked}-${ivaRate}-${retRate}-${reteicaRate}-${reteivaToggle.checked}`;
                if (currentCalc !== lastSavedCalc) {
                    const item = {
                        input: amountInput.value,
                        total: formatCurrency(finalTotal),
                        mode: !calcMode.checked ? 'total' : 'base' as 'total' | 'base',
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
        if (calcMode.checked) {
            inputLabel.textContent = "Monto Base (COP)";
            modeBaseLabel.classList.add('active');
            modeTotalLabel.classList.remove('active');
        } else {
            inputLabel.textContent = "Monto Total (COP)";
            modeTotalLabel.classList.add('active');
            modeBaseLabel.classList.remove('active');
        }
        calculateIVA();
    });

    const copyBtn = document.getElementById('copy-btn') as HTMLElement;
    const historyList = document.getElementById('history-list') as HTMLElement;
    const clearHistoryBtn = document.getElementById('clear-history') as HTMLElement;

    // Load history on start
    renderHistory();

    function getHistory(): HistoryItem[] {
        const history = localStorage.getItem('iva_history');
        return history ? JSON.parse(history) : [];
    }

    function saveToHistory(item: HistoryItem) {
        let history = getHistory();
        history.unshift(item); // Add to beginning
        history = history.slice(0, 5); // Keep last 5
        localStorage.setItem('iva_history', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        if (!historyList) return;
        const history = getHistory();
        if (history.length === 0) {
            historyList.innerHTML = '<p class="empty-msg">No hay cálculos guardados.</p>';
            return;
        }

        historyList.innerHTML = '';
        history.forEach((item: HistoryItem) => {
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

    amountInput.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
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
            if (retRate > 0) textToCopy += `Retención Fuente (${retRate * 100}%): ${retentionValue.textContent}\n`;
            if (reteivaToggle.checked) textToCopy += `ReteIVA (15% del IVA): ${reteivaValue.textContent}\n`;
            if (reteicaRate > 0) textToCopy += `ReteICA (${(reteicaRate * 100).toFixed(3)}%): ${reteicaValue.textContent}\n`;
            textToCopy += `Total a Pagar (Neto): ${totalRaw}\n`;
        } else {
            textToCopy += `Total: ${totalRaw}\n`;
        }
        textToCopy += `-----------------------------------`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.classList.add('copied');
            const copySpan = copyBtn.querySelector('span');
            if (copySpan) copySpan.textContent = '¡Copiado!';

            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = originalText;
            }, 2000);
        });
    });

    const themeToggle = document.getElementById('theme-toggle') as HTMLElement;

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
    let newWorker: ServiceWorker | null = null;
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
                                if (updateToast) updateToast.classList.remove('hidden');
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
    const themeMenuBtn = document.getElementById('theme-menu-btn') as HTMLElement;
    const themeDropdown = document.getElementById('theme-dropdown') as HTMLElement;
    const themeSwatches = document.querySelectorAll('.theme-swatch') as NodeListOf<HTMLElement>;

    // Toggle dropdown
    themeMenuBtn.addEventListener('click', (e: Event) => {
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

    function applyTheme(theme: string) {
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
