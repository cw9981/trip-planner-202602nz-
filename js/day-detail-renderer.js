document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dayId = urlParams.get('day');

    if (!dayId) {
        showError('未指定行程 ID');
        return;
    }

    // Fetch both the specific day data and the full itinerary to calculate navigation
    Promise.all([
        fetch(`data/day_details/${dayId}.json`).then(r => {
            if (!r.ok) throw new Error(`無法載入數據: ${r.status}`);
            return r.json();
        }),
        fetch('data/data_itinerary.json').then(r => r.ok ? r.json() : null).catch(() => null)
    ])
        .then(([data, itineraryData]) => {
            renderPage(data);
            if (itineraryData) {
                renderNavigation(dayId, itineraryData);
            }
        })
        .catch(error => {
            console.error(error);
            showError('載入失敗，請確認檔案是否存在');
        });
});

function showError(msg) {
    const container = document.getElementById('content-container');
    container.innerHTML = `<div style="text-align: center; padding: 50px; color: #ef4444;">${msg}</div>`;
}

function renderPage(data) {
    document.title = data.meta.title;
    const container = document.getElementById('content-container');
    container.innerHTML = ''; // Clear loading

    // Add Back Button
    const backBtn = document.createElement('a');
    backBtn.href = 'itinerary.html'; // Direct link to avoid redirect flash
    backBtn.className = 'back-btn';
    backBtn.innerHTML = '← 回行程表';
    // Inline styles for simplicity, or add to CSS
    backBtn.style.cssText = `
        display: inline-block;
        margin-bottom: 15px;
        padding: 8px 16px;
        background-color: rgba(30, 58, 138, 0.4);
        border: 1px solid #3b82f6;
        border-radius: 8px;
        text-decoration: none;
        color: #93c5fd;
        font-weight: bold;
        transition: all 0.2s;
    `;
    container.appendChild(backBtn);


    // Render Header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'header';
    headerDiv.innerHTML = `
        <h1>${data.meta.title}</h1>
        <p style="text-align: center; color: #cbd5e1;">${data.meta.subtitle}</p>
        ${data.meta.drivingNote ? `<div class="driving-note" style="margin-top: 20px;">${data.meta.drivingNote}</div>` : ''}
    `;
    container.appendChild(headerDiv);

    // Render Sections
    if (data.sections) {
        data.sections.forEach(section => {
            if (section.type === 'zone') {
                container.appendChild(renderZoneSection(section));
            } else if (section.type === 'hike-info') {
                container.appendChild(renderHikeInfoSection(section));
            } else if (section.type === 'comparison-table') {
                container.appendChild(renderComparisonSection(section));
            }
        });
    }

    // Render Footer
    if (data.footer) {
        const footerDiv = document.createElement('div');
        footerDiv.style.cssText = "text-align: center; margin-top: 30px; padding: 15px; color: #94a3b8; font-size: 0.9rem; border-top: 1px solid #334155;";

        let footerHtml = '';
        if (data.footer.title) {
            footerHtml += `<p><strong>${data.footer.title}</strong></p><p style="margin-top: 5px;"></p>`;
        }

        data.footer.notes.forEach(note => {
            if (note.startsWith("NOTE:")) {
                const text = note.replace("NOTE:", "").trim();
                footerHtml += `<p style="margin-top: 10px; color: var(--accent-color, #60a5fa);">${text}</p>`;
            } else {
                footerHtml += `<p>${note}</p>`;
            }
        });

        footerDiv.innerHTML = footerHtml;
        container.appendChild(footerDiv);
    }
}

function renderZoneSection(section) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'zone-section';
    if (section.title) {
        // Handle common zone pattern vs hike-info pattern in mixed usages
        // Actually zone-section usually has a header inside
        let headerHtml = `
            <div class="zone-header">
                <div class="zone-title">${section.title}</div>
                ${section.badge ? `<div class="duration-badge">${section.badge}</div>` : ''}
            </div>
        `;

        if (section.description) {
            headerHtml += section.description;
        }

        // Just append to internal html
        sectionDiv.innerHTML = headerHtml;
    }

    // Check for items like in hike-info specific zones
    if (section.items) {
        const gridDiv = document.createElement('div');
        gridDiv.className = 'info-grid';
        section.items.forEach(item => {
            gridDiv.innerHTML += `
                <div class="info-item">
                    <strong>${item.label}</strong>
                    <p>${item.value}</p>
                </div>
            `;
        });
        sectionDiv.appendChild(gridDiv);
    }

    if (section.links) {
        const linkContainer = document.createElement('div');
        linkContainer.className = 'link-container';
        section.links.forEach(link => {
            linkContainer.innerHTML += `<a href="${link.url}" target="_blank" class="map-link">${link.text}</a>`;
        });
        sectionDiv.appendChild(linkContainer);
    }

    if (section.highlight) {
        const hlDiv = document.createElement('div');
        hlDiv.className = 'difficulty-highlight'; // reusing class
        if (section.highlight.type === 'warning') {
            hlDiv.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            hlDiv.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            hlDiv.style.color = '#fca5a5';
        }
        hlDiv.innerHTML = `${section.highlight.text}`;
        sectionDiv.appendChild(hlDiv);
    }

    if (section.timeBlocks) {
        section.timeBlocks.forEach(block => {
            const blockDiv = document.createElement('div');
            blockDiv.className = 'time-block';
            blockDiv.innerHTML = `
                <div class="time-header">
                    <span>${block.header.time}</span>
                    <span class="duration">${block.header.label}</span>
                </div>
                <div class="activity-details">
                    ${block.rows.map(row => `
                        <div class="detail-row">
                            <div class="detail-label">${row.label}</div>
                            <div class="detail-content">${row.content}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            sectionDiv.appendChild(blockDiv);
        });
    }

    return sectionDiv;
}

function renderHikeInfoSection(section) {
    if (section.headerTitle) {
        const trailSection = document.createElement('div');
        trailSection.className = 'trail-section';
        trailSection.innerHTML = `
            <div class="trail-header">
                <div class="trail-icon">${section.headerIcon || ''}</div>
                <div class="trail-name">${section.headerTitle}</div>
            </div>
         `;
        const innerDiv = renderHikeInfoContent(section);
        trailSection.appendChild(innerDiv);
        return trailSection;
    } else {
        return renderHikeInfoContent(section);
    }
}

function renderHikeInfoContent(section) {
    const div = document.createElement('div');
    div.className = 'hike-info';

    if (section.title) {
        div.innerHTML += `<h2>${section.title}</h2>`;
    }

    // Items Grid
    if (section.items) {
        const grid = document.createElement('div');
        grid.className = 'info-grid';
        section.items.forEach(item => {
            grid.innerHTML += `
                <div class="info-item">
                    <strong>${item.label}</strong>
                    <p>${item.value}</p>
                </div>
            `;
        });
        div.appendChild(grid);
    }

    // Water Taxi
    if (section.waterTaxi) {
        const wt = section.waterTaxi;
        const box = document.createElement('div');
        box.className = 'water-taxi-alert';
        box.innerHTML = `<strong>${wt.title}</strong>${wt.description}`;
        div.appendChild(box);

        if (wt.schedule) {
            const table = document.createElement('div');
            table.className = 'timetable';
            table.innerHTML = '<h3>📅 水上Taxi參考時間表</h3><div class="timetable-grid"></div>';
            const grid = table.querySelector('.timetable-grid');
            wt.schedule.forEach(s => {
                grid.innerHTML += `
                    <div class="timetable-item">
                        <div class="timetable-direction">${s.direction}</div>
                        <div class="timetable-times">${s.times}</div>
                    </div>
                `;
            });
            div.appendChild(table);
        }
    }

    // Highlight
    if (section.highlight) {
        const hl = document.createElement('div');
        hl.className = 'difficulty-highlight';
        hl.innerHTML = `<strong>${section.highlight.text}</strong><p style="margin-top: 5px;">${section.highlight.detail}</p>`;
        div.appendChild(hl);
    }

    // Feature
    if (section.feature) {
        const f = document.createElement('div');
        // Determine class based on title or generic
        if (section.title && section.title.includes('Routeburn')) f.className = 'routeburn-feature';
        else if (section.title && section.title.includes('Kepler')) f.className = 'kepler-feature';
        else f.className = 'routeburn-feature'; // fallback

        f.style.cssText = "background-color: rgba(16, 185, 129, 0.1); border-radius: 8px; padding: 15px; margin-top: 15px; border: 1px solid rgba(16, 185, 129, 0.3);"; // Inline generic style for safety

        f.innerHTML = `<h3>${section.feature.title}</h3><ul>${section.feature.list.map(l => `<li>${l}</li>`).join('')}</ul>`;
        div.appendChild(f);
    }

    // Key Point Section
    if (section.keyPointSection) {
        div.innerHTML += `<h2 style="margin-top: 25px;">${section.keyPointSection.title}</h2>`;
        const kpGrid = document.createElement('div');
        kpGrid.className = 'key-points'; // Ensure CSS exists or use info-grid
        kpGrid.innerHTML = section.keyPointSection.items.map(item => `
             <div class="key-point" style="background-color: rgba(30, 58, 138, 0.2); padding: 15px; border-radius: 8px; border-left: 4px solid #60a5fa; margin-bottom: 10px;">
                <strong>${item.label}</strong>
                <p>${item.value}</p>
             </div>
        `).join('');
        div.appendChild(kpGrid);
    }

    // Links
    if (section.links) {
        const links = document.createElement('div');
        links.className = 'link-container';
        section.links.forEach(l => {
            links.innerHTML += `<a href="${l.url}" target="_blank" class="map-link">${l.text}</a>`;
        });
        div.appendChild(links);
    }

    return div;
}

function renderComparisonSection(section) {
    const div = document.createElement('div');
    div.className = 'hike-info';
    div.innerHTML = `<h2>${section.title}</h2>`;

    // Table
    const table = document.createElement('table');
    table.className = 'comparison-table';
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr>${section.headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tbody.innerHTML = section.rows.map(row => `
        <tr>${row.map((cell, i) => i === 0 ? `<td><strong>${cell}</strong></td>` : `<td>${cell}</td>`).join('')}</tr>
    `).join('');
    table.appendChild(tbody);
    div.appendChild(table);

    // Pros/Cons
    if (section.prosCons) {
        section.prosCons.forEach(pc => {
            // To simplify rendering, we might need a custom layout or just render them one by one
            // But the original had them side-by-side. 
            // Let's create a pros-cons container
        });

        const container = document.createElement('div');
        container.className = 'pros-cons';

        // This is a bit tricky to genericize perfectly, assuming 2 items for side-by-side
        if (section.prosCons.length === 2 && section.prosCons[0].title === "Roy's Peak") {
            // Hardcoded layout for side-by-side to match original
            // Actually, let's just render them.
            const pcHtml = section.prosCons.map(pc => `
                <div class="${pc.title.includes('Isthmus') || pc.title.includes('Roy') ? 'pros' : 'cons'}" style="flex: 1; padding: 15px; border-radius: 8px; background-color: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; margin-bottom:10px;">
                    <h4>${pc.title}</h4>
                    <div style="margin-top:10px;">
                       <strong>✅ 優點</strong>
                       <ul>${pc.pros.map(p => `<li>${p}</li>`).join('')}</ul>
                    </div>
                    <div style="margin-top:10px;">
                       <strong>⚠️ 缺點</strong>
                       <ul>${pc.cons.map(c => `<li>${c}</li>`).join('')}</ul>
                    </div>
                </div>
             `).join('');
            // Note: The original had separated Pros block and Cons block. My JSON combined them. 
            // Logic adaptation:
            // Let's render "Pros of A" and "Cons of A" ?
            // The original was: [Roy's Pros] [Roy's Cons] ... wait no.
            // Original: 
            // <div class="pros-cons"> <div class="pros">Roy Pros</div> <div class="cons">Roy Cons</div> </div>
            // <div class="pros-cons"> <div class="pros">Isthmus Pros</div> <div class="cons">Isthmus Cons</div> </div>
            // My JSON: [ {title: Roy, pros:[], cons:[]}, {title: Isthmus, pros:[], cons:[]} ]

            div.innerHTML += section.prosCons.map(pc => `
                <h3 style="margin-top:20px;">${pc.title} 分析</h3>
                <div class="pros-cons" style="display: flex; gap: 20px; flex-direction: row;">
                    <div class="pros" style="flex:1; background-color: rgba(16, 185, 129, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                        <h4>✅ 優點</h4>
                        <ul>${pc.pros.map(p => `<li>${p}</li>`).join('')}</ul>
                    </div>
                    <div class="cons" style="flex:1; background-color: rgba(239, 68, 68, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
                        <h4>⚠️ 缺點</h4>
                        <ul>${pc.cons.map(c => `<li>${c}</li>`).join('')}</ul>
                    </div>
                </div>
             `).join('');
        }
    }

    // Recommendation
    if (section.recommendation) {
        const r = section.recommendation;
        const divRec = document.createElement('div');
        divRec.className = 'recommendation-highlight';
        divRec.innerHTML = `<strong>${r.title}</strong><div style="margin-top: 10px;">
            ${r.items.map(item => `
                <p style="color: #a7f3d0; margin-bottom: 10px;"><strong>${item.title}</strong></p>
                <ul style="color: #a7f3d0; margin-left: 20px; margin-bottom: 15px;">${item.list.map(l => `<li>${l}</li>`).join('')}</ul>
            `).join('')}
            <p style="color: #a7f3d0; margin-top: 15px; font-weight: bold;">${r.warning}</p>
        </div>`;
        div.appendChild(divRec);
    }

    return div;
}

function renderNavigation(currentDayId, itineraryData) {
    // Flatten itinerary to get list of day IDs in order
    const dayLinks = [];
    itineraryData.forEach(stage => {
        stage.itinerary.forEach(day => {
            if (day.comments && day.comments.includes('day_template.html')) {
                const match = day.comments.match(/day=([^&]+)/);
                if (match) {
                    dayLinks.push({
                        id: match[1],
                        date: day.date
                    });
                }
            }
        });
    });

    const currentIndex = dayLinks.findIndex(link => link.id === currentDayId);
    if (currentIndex === -1) return;

    const prevLink = currentIndex > 0 ? dayLinks[currentIndex - 1] : null;
    const nextLink = currentIndex < dayLinks.length - 1 ? dayLinks[currentIndex + 1] : null;

    if (!prevLink && !nextLink) return;

    const navContainer = document.createElement('div');
    navContainer.className = 'mobile-nav-footer';
    navContainer.innerHTML = `
        <div class="nav-buttons">
            ${prevLink ? `<a href="day_template.html?day=${prevLink.id}" class="nav-btn prev-btn">← ${prevLink.date}</a>` : '<div></div>'}
            ${nextLink ? `<a href="day_template.html?day=${nextLink.id}" class="nav-btn next-btn">${nextLink.date} →</a>` : '<div></div>'}
        </div>
    `;

    // Add styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .mobile-nav-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(8px);
            border-top: 1px solid #334155;
            padding: 15px;
            z-index: 1000;
            box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
        }
        .nav-buttons {
            display: flex;
            justify-content: space-between;
            max-width: 800px;
            margin: 0 auto;
        }
        .nav-btn {
            background: rgba(30, 58, 138, 0.4);
            color: #93c5fd;
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            border: 1px solid #3b82f6;
            transition: all 0.2s;
        }
        .nav-btn:hover {
            background: rgba(30, 58, 138, 0.8);
            color: white;
            transform: translateY(-2px);
        }
        @media (max-width: 600px) {
             .mobile-nav-footer {
                padding: 10px 15px; /* Smaller padding on mobile */
             }
             .nav-btn {
                padding: 8px 15px; /* Smaller buttons on mobile */
                font-size: 0.9rem;
             }
        }
        /* Add padding to body so content isn't hidden behind footer */
        body {
            padding-bottom: 80px; 
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(navContainer);
}
