// GambleCodez Admin Panel Application
class GambleCodezAdmin {
    constructor() {
        this.currentUser = null;
        this.currentView = 'login';
        this.data = this.initializeData();
        this.init();
    }

    initializeData() {
        return {
            // Sample Affiliates Data
            affiliates: [
                {
                    id: 1,
                    name: "Ace",
                    handle: "ace-casino",
                    email: "affiliate@ace.com",
                    status: "active",
                    region: "usa",
                    tags: "casino",
                    referral_code: "ACE001",
                    referral_url: "https://ace.casino/r/ACE001",
                    telegram_user_id: 123456789,
                    created_at: "2024-01-15",
                    conversions: 45,
                    revenue: 2250.00
                },
                {
                    id: 2,
                    name: "BCH.GAMES",
                    handle: "bch-games",
                    email: "partner@bch.games",
                    status: "active",
                    region: "non-us",
                    tags: "casino,faucet,no-kyc,instant",
                    referral_code: "BCH002",
                    referral_url: "https://bch.games/r/BCH002",
                    telegram_user_id: 987654321,
                    created_at: "2024-02-01",
                    conversions: 78,
                    revenue: 3900.00
                },
                {
                    id: 3,
                    name: "Stake.us",
                    handle: "stake-us",
                    email: "partners@stake.us",
                    status: "paused",
                    region: "usa",
                    tags: "casino",
                    referral_code: "STAKE003",
                    referral_url: "https://stake.us/r/STAKE003",
                    telegram_user_id: 555444333,
                    created_at: "2024-01-20",
                    conversions: 156,
                    revenue: 7800.00
                }
            ],
            
            // Sample Campaigns
            campaigns: [
                {
                    id: 1,
                    name: "Q4 2024 Casino Blitz",
                    status: "active",
                    payout_model: "cpa",
                    cpa_amount: 50.00,
                    revshare_percent: 0,
                    start_date: "2024-10-01",
                    end_date: "2024-12-31",
                    target_conversions: 1000,
                    current_conversions: 234
                },
                {
                    id: 2,
                    name: "Crypto Winter Special",
                    status: "active",
                    payout_model: "revshare",
                    cpa_amount: 0,
                    revshare_percent: 25.0,
                    start_date: "2024-11-01",
                    end_date: "2025-01-31",
                    target_conversions: 500,
                    current_conversions: 89
                }
            ],
            
            // Sample Conversions
            conversions: [
                {
                    id: 1,
                    affiliate_id: 1,
                    campaign_id: 1,
                    amount: 150.00,
                    status: "approved",
                    occurred_at: "2024-10-26T14:30:00Z",
                    external_tx_id: "TX123456"
                },
                {
                    id: 2,
                    affiliate_id: 2,
                    campaign_id: 2,
                    amount: 75.00,
                    status: "pending",
                    occurred_at: "2024-10-26T16:45:00Z",
                    external_tx_id: "TX789012"
                }
            ],
            
            // Sample Payouts
            payouts: [
                {
                    id: 1,
                    affiliate_id: 1,
                    period_start: "2024-10-01",
                    period_end: "2024-10-31",
                    gross: 2250.00,
                    net: 2250.00,
                    status: "approved",
                    approved_at: "2024-11-01T10:00:00Z"
                },
                {
                    id: 2,
                    affiliate_id: 2,
                    period_start: "2024-10-01",
                    period_end: "2024-10-31",
                    gross: 1950.00,
                    net: 1950.00,
                    status: "calculated"
                }
            ],
            
            // Telegram Bot Configuration
            telegram_config: {
                bot_token: "123456:ABCDEF-YOUR-BOT-TOKEN",
                bot_username: "GambleCodezBot",
                channel_id: "@GambleCodezChannel",
                group_id: "-1001234567890",
                webhook_url: "https://gamble-codez.com/webhook"
            },
            
            // System Settings
            settings: {
                feature_flags: {
                    broadcast_enabled: true,
                    moderation_enforced: true,
                    payouts_auto_approve: false,
                    ui_animations_enabled: true,
                    onload_ad_enabled: true
                },
                branding: {
                    theme: "neon-dark",
                    primary_color: "#00eaff",
                    accent_color: "#8a2be2"
                },
                pagination: {
                    page_size: 25,
                    max_results: 1000
                }
            },
            
            // Sample Broadcast Messages
            broadcasts: [
                {
                    id: 1,
                    title: "Weekly Update",
                    content: "<b>🎰 Weekly GambleCodez Update</b>\n\nNew affiliates added this week!\nCheck out the latest promotions.",
                    status: "sent",
                    target: "channel",
                    scheduled_at: "2024-10-25T18:00:00Z",
                    sent_at: "2024-10-25T18:00:15Z"
                },
                {
                    id: 2,
                    title: "Maintenance Notice",
                    content: "<b>⚠️ Scheduled Maintenance</b>\n\nSystem maintenance from 2-4 AM UTC tonight.",
                    status: "scheduled",
                    target: "group",
                    scheduled_at: "2024-10-28T01:45:00Z"
                }
            ],
            
            // Auto Responses
            auto_responses: [
                {
                    id: 1,
                    trigger_type: "command",
                    trigger_value: "/faucet",
                    response: "<b>🚰 Faucet Casinos</b>\n\nHere are our top faucet recommendations:\n• BCH.GAMES\n• LuckyBird\n• TrustDice",
                    status: "active"
                },
                {
                    id: 2,
                    trigger_type: "keyword",
                    trigger_value: "fish tables",
                    response: "<b>🐠 Fish Tables</b>\n\nLooking for fish tables? Check out FishTables.io!",
                    status: "active"
                }
            ]
        };
    }

    init() {
        this.render();
    }

    // Authentication
    login(username, password) {
        if (username === 'admin' && password === 'Dope!1988') {
            this.currentUser = { username: 'admin', role: 'owner' };
            this.currentView = 'dashboard';
            this.showNotification('Login successful!', 'success');
            this.render();
            return true;
        }
        this.showNotification('Invalid credentials!', 'error');
        return false;
    }

    logout() {
        this.currentUser = null;
        this.currentView = 'login';
        this.render();
    }

    // Navigation
    navigate(view) {
        this.currentView = view;
        this.render();
    }

    // Rendering Methods
    render() {
        const app = document.getElementById('app');
        
        if (!this.currentUser) {
            app.innerHTML = this.renderLogin();
            this.attachLoginHandlers();
        } else {
            app.innerHTML = this.renderMainLayout();
            this.attachMainHandlers();
        }
    }

    renderLogin() {
        return `
            <div class="login-container">
                <div class="login-form">
                    <div class="logo">
                        <svg class="crown-svg" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="crown-grad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stop-color="#00eaff"/>
                                    <stop offset="100%" stop-color="#8a2be2"/>
                                </linearGradient>
                            </defs>
                            <path class="crown-path" d="M10 80 L40 20 L70 60 L100 10 L130 60 L160 20 L190 80 Z"
                                  fill="none" stroke="url(#crown-grad)" stroke-width="4" />
                        </svg>
                        <h1 class="login-title">GambleCodez Admin</h1>
                    </div>
                    
                    <form id="loginForm">
                        <div class="form-group">
                            <label class="form-label">Username</label>
                            <input type="text" class="form-input" id="username" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Password</label>
                            <input type="password" class="form-input" id="password" required>
                        </div>
                        
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-sign-in-alt"></i>
                            Login to Admin Panel
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    renderMainLayout() {
        return `
            <div class="main-layout">
                ${this.renderSidebar()}
                ${this.renderContent()}
            </div>
        `;
    }

    renderSidebar() {
        const menuItems = [
            { id: 'dashboard', icon: 'fas fa-chart-line', label: 'Dashboard' },
            { id: 'affiliates', icon: 'fas fa-users', label: 'Affiliates' },
            { id: 'campaigns', icon: 'fas fa-bullhorn', label: 'Campaigns' },
            { id: 'conversions', icon: 'fas fa-exchange-alt', label: 'Conversions' },
            { id: 'payouts', icon: 'fas fa-money-bill-wave', label: 'Payouts' },
            { id: 'telegram', icon: 'fab fa-telegram', label: 'Telegram Bot' },
            { id: 'settings', icon: 'fas fa-cog', label: 'Settings' },
            { id: 'system', icon: 'fas fa-server', label: 'System Tools' }
        ];

        return `
            <aside class="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">GambleCodez</div>
                </div>
                
                <nav class="sidebar-nav">
                    ${menuItems.map(item => `
                        <a href="#" class="nav-item ${this.currentView === item.id ? 'active' : ''}" 
                           onclick="app.navigate('${item.id}')">
                            <i class="${item.icon}"></i>
                            ${item.label}
                        </a>
                    `).join('')}
                    
                    <a href="#" class="nav-item" onclick="app.logout()">
                        <i class="fas fa-sign-out-alt"></i>
                        Logout
                    </a>
                </nav>
            </aside>
        `;
    }

    renderContent() {
        const views = {
            dashboard: this.renderDashboard(),
            affiliates: this.renderAffiliates(),
            campaigns: this.renderCampaigns(),
            conversions: this.renderConversions(),
            payouts: this.renderPayouts(),
            telegram: this.renderTelegram(),
            settings: this.renderSettings(),
            system: this.renderSystem()
        };

        return `
            <main class="content">
                ${views[this.currentView] || views.dashboard}
            </main>
        `;
    }

    renderDashboard() {
        const totalAffiliates = this.data.affiliates.length;
        const activeAffiliates = this.data.affiliates.filter(a => a.status === 'active').length;
        const totalConversions = this.data.conversions.length;
        const totalRevenue = this.data.affiliates.reduce((sum, a) => sum + a.revenue, 0);
        const pendingPayouts = this.data.payouts.filter(p => p.status === 'calculated').length;

        return `
            <div class="content-header">
                <h1 class="content-title">Dashboard</h1>
                <p class="content-subtitle">Overview of your affiliate network performance</p>
            </div>
            
            <div class="content-body">
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header">
                            <span class="card-title">Total Affiliates</span>
                            <i class="fas fa-users" style="color: var(--primary);"></i>
                        </div>
                        <div class="card-value">${totalAffiliates}</div>
                        <div class="card-change positive">+${Math.floor(Math.random() * 10) + 1} this month</div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-header">
                            <span class="card-title">Active Affiliates</span>
                            <i class="fas fa-check-circle" style="color: var(--success);"></i>
                        </div>
                        <div class="card-value">${activeAffiliates}</div>
                        <div class="card-change positive">${Math.round((activeAffiliates/totalAffiliates)*100)}% of total</div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-header">
                            <span class="card-title">Total Conversions</span>
                            <i class="fas fa-exchange-alt" style="color: var(--warning);"></i>
                        </div>
                        <div class="card-value">${totalConversions}</div>
                        <div class="card-change positive">+${Math.floor(Math.random() * 20) + 5} this week</div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-header">
                            <span class="card-title">Total Revenue</span>
                            <i class="fas fa-dollar-sign" style="color: var(--accent);"></i>
                        </div>
                        <div class="card-value">$${totalRevenue.toLocaleString()}</div>
                        <div class="card-change positive">+${Math.floor(Math.random() * 15) + 5}% this month</div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-header">
                            <span class="card-title">Pending Payouts</span>
                            <i class="fas fa-clock" style="color: var(--warning);"></i>
                        </div>
                        <div class="card-value">${pendingPayouts}</div>
                        <div class="card-change">Awaiting approval</div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-header">
                            <span class="card-title">Bot Status</span>
                            <i class="fab fa-telegram" style="color: var(--primary);"></i>
                        </div>
                        <div class="card-value">Online</div>
                        <div class="card-change positive">All systems operational</div>
                    </div>
                </div>
                
                <div class="table-container">
                    <div class="table-header">
                        <h3 class="table-title">Recent Activity</h3>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Activity</th>
                                <th>Affiliate</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.data.conversions.slice(0, 5).map(conversion => {
                                const affiliate = this.data.affiliates.find(a => a.id === conversion.affiliate_id);
                                return `
                                    <tr>
                                        <td>${new Date(conversion.occurred_at).toLocaleString()}</td>
                                        <td>Conversion</td>
                                        <td>${affiliate ? affiliate.name : 'Unknown'}</td>
                                        <td>$${conversion.amount}</td>
                                        <td><span class="status-badge status-${conversion.status}">${conversion.status}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderAffiliates() {
        return `
            <div class="content-header">
                <h1 class="content-title">Affiliate Management</h1>
                <p class="content-subtitle">Manage your affiliate network</p>
            </div>
            
            <div class="content-body">
                <div class="table-container">
                    <div class="table-header">
                        <h3 class="table-title">All Affiliates</h3>
                        <input type="text" class="search-input" placeholder="Search affiliates..." id="affiliateSearch">
                        <button class="btn btn-primary btn-sm" onclick="app.showAddAffiliateModal()">
                            <i class="fas fa-plus"></i> Add Affiliate
                        </button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Handle</th>
                                <th>Email</th>
                                <th>Region</th>
                                <th>Status</th>
                                <th>Conversions</th>
                                <th>Revenue</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.data.affiliates.map(affiliate => `
                                <tr>
                                    <td>${affiliate.name}</td>
                                    <td>${affiliate.handle}</td>
                                    <td>${affiliate.email}</td>
                                    <td>${affiliate.region.toUpperCase()}</td>
                                    <td><span class="status-badge status-${affiliate.status}">${affiliate.status}</span></td>
                                    <td>${affiliate.conversions}</td>
                                    <td>$${affiliate.revenue.toLocaleString()}</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-secondary btn-sm" onclick="app.editAffiliate(${affiliate.id})">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-${affiliate.status === 'active' ? 'warning' : 'success'} btn-sm" 
                                                    onclick="app.toggleAffiliateStatus(${affiliate.id})">
                                                <i class="fas fa-${affiliate.status === 'active' ? 'pause' : 'play'}"></i>
                                            </button>
                                            <button class="btn btn-danger btn-sm" onclick="app.deleteAffiliate(${affiliate.id})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderCampaigns() {
        return `
            <div class="content-header">
                <h1 class="content-title">Campaign Management</h1>
                <p class="content-subtitle">Create and manage marketing campaigns</p>
            </div>
            
            <div class="content-body">
                <div class="table-container">
                    <div class="table-header">
                        <h3 class="table-title">Active Campaigns</h3>
                        <button class="btn btn-primary btn-sm" onclick="app.showAddCampaignModal()">
                            <i class="fas fa-plus"></i> New Campaign
                        </button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Model</th>
                                <th>Payout</th>
                                <th>Period</th>
                                <th>Progress</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.data.campaigns.map(campaign => `
                                <tr>
                                    <td>${campaign.name}</td>
                                    <td>${campaign.payout_model.toUpperCase()}</td>
                                    <td>
                                        ${campaign.payout_model === 'cpa' ? `$${campaign.cpa_amount}` : 
                                          campaign.payout_model === 'revshare' ? `${campaign.revshare_percent}%` : 'Hybrid'}
                                    </td>
                                    <td>${campaign.start_date} - ${campaign.end_date}</td>
                                    <td>${campaign.current_conversions}/${campaign.target_conversions}</td>
                                    <td><span class="status-badge status-${campaign.status}">${campaign.status}</span></td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-secondary btn-sm" onclick="app.editCampaign(${campaign.id})">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-warning btn-sm" onclick="app.pauseCampaign(${campaign.id})">
                                                <i class="fas fa-pause"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderConversions() {
        return `
            <div class="content-header">
                <h1 class="content-title">Conversion Tracking</h1>
                <p class="content-subtitle">Monitor and manage affiliate conversions</p>
            </div>
            
            <div class="content-body">
                <div class="table-container">
                    <div class="table-header">
                        <h3 class="table-title">Recent Conversions</h3>
                        <input type="text" class="search-input" placeholder="Search conversions...">
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Affiliate</th>
                                <th>Campaign</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.data.conversions.map(conversion => {
                                const affiliate = this.data.affiliates.find(a => a.id === conversion.affiliate_id);
                                const campaign = this.data.campaigns.find(c => c.id === conversion.campaign_id);
                                return `
                                    <tr>
                                        <td>#${conversion.id}</td>
                                        <td>${affiliate ? affiliate.name : 'Unknown'}</td>
                                        <td>${campaign ? campaign.name : 'N/A'}</td>
                                        <td>$${conversion.amount}</td>
                                        <td>${new Date(conversion.occurred_at).toLocaleDateString()}</td>
                                        <td><span class="status-badge status-${conversion.status}">${conversion.status}</span></td>
                                        <td>
                                            <div class="action-buttons">
                                                ${conversion.status === 'pending' ? `
                                                    <button class="btn btn-success btn-sm" onclick="app.approveConversion(${conversion.id})">
                                                        <i class="fas fa-check"></i>
                                                    </button>
                                                    <button class="btn btn-danger btn-sm" onclick="app.rejectConversion(${conversion.id})">
                                                        <i class="fas fa-times"></i>
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderPayouts() {
        return `
            <div class="content-header">
                <h1 class="content-title">Payout Management</h1>
                <p class="content-subtitle">Calculate and process affiliate payouts</p>
            </div>
            
            <div class="content-body">
                <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
                    <div class="dashboard-card">
                        <div class="card-header">
                            <span class="card-title">Total Payouts</span>
                        </div>
                        <div class="card-value">$${this.data.payouts.reduce((sum, p) => sum + p.net, 0).toLocaleString()}</div>
                    </div>
                    <div class="dashboard-card">
                        <div class="card-header">
                            <span class="card-title">Pending Approval</span>
                        </div>
                        <div class="card-value">${this.data.payouts.filter(p => p.status === 'calculated').length}</div>
                    </div>
                </div>
                
                <div class="table-container">
                    <div class="table-header">
                        <h3 class="table-title">Payout History</h3>
                        <button class="btn btn-primary btn-sm" onclick="app.calculatePayouts()">
                            <i class="fas fa-calculator"></i> Calculate Payouts
                        </button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Affiliate</th>
                                <th>Period</th>
                                <th>Gross</th>
                                <th>Net</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.data.payouts.map(payout => {
                                const affiliate = this.data.affiliates.find(a => a.id === payout.affiliate_id);
                                return `
                                    <tr>
                                        <td>#${payout.id}</td>
                                        <td>${affiliate ? affiliate.name : 'Unknown'}</td>
                                        <td>${payout.period_start} - ${payout.period_end}</td>
                                        <td>$${payout.gross.toLocaleString()}</td>
                                        <td>$${payout.net.toLocaleString()}</td>
                                        <td><span class="status-badge status-${payout.status}">${payout.status}</span></td>
                                        <td>
                                            <div class="action-buttons">
                                                ${payout.status === 'calculated' ? `
                                                    <button class="btn btn-success btn-sm" onclick="app.approvePayout(${payout.id})">
                                                        <i class="fas fa-check"></i> Approve
                                                    </button>
                                                ` : ''}
                                                ${payout.status === 'approved' ? `
                                                    <button class="btn btn-primary btn-sm" onclick="app.markPaid(${payout.id})">
                                                        <i class="fas fa-money-bill-wave"></i> Mark Paid
                                                    </button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderTelegram() {
        return `
            <div class="content-header">
                <h1 class="content-title">Telegram Bot Management</h1>
                <p class="content-subtitle">Manage bot settings, broadcasts, and auto-responses</p>
            </div>
            
            <div class="content-body">
                <div class="form-grid">
                    <div class="form-section">
                        <h3 class="section-title">Bot Configuration</h3>
                        <div class="form-group">
                            <label class="form-label">Bot Token</label>
                            <input type="text" class="form-input" value="${this.data.telegram_config.bot_token}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Bot Username</label>
                            <input type="text" class="form-input" value="${this.data.telegram_config.bot_username}">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Channel ID</label>
                                <input type="text" class="form-input" value="${this.data.telegram_config.channel_id}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Group ID</label>
                                <input type="text" class="form-input" value="${this.data.telegram_config.group_id}">
                            </div>
                        </div>
                        <button class="btn btn-primary" onclick="app.updateBotConfig()">
                            <i class="fas fa-save"></i> Save Configuration
                        </button>
                    </div>
                    
                    <div class="form-section">
                        <h3 class="section-title">Bot Status</h3>
                        <div class="dashboard-card">
                            <div class="card-header">
                                <span class="card-title">Current Status</span>
                                <i class="fas fa-circle" style="color: var(--success);"></i>
                            </div>
                            <div class="card-value">Online</div>
                            <div class="card-change positive">Last seen: Just now</div>
                        </div>
                        <div style="margin-top: 1rem;">
                            <button class="btn btn-warning" onclick="app.restartBot()">
                                <i class="fas fa-redo"></i> Restart Bot
                            </button>
                            <button class="btn btn-secondary" onclick="app.viewBotLogs()">
                                <i class="fas fa-file-alt"></i> View Logs
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="broadcast-composer">
                    <div class="composer-header">
                        <h3 class="section-title">Broadcast Message</h3>
                    </div>
                    <div class="composer-body">
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Title</label>
                                <input type="text" class="form-input" id="broadcastTitle" placeholder="Message title">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Target</label>
                                <select class="form-select" id="broadcastTarget">
                                    <option value="channel">Channel</option>
                                    <option value="group">Group</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Message Content (HTML supported)</label>
                            <textarea class="form-input form-textarea" id="broadcastContent" 
                                      placeholder="<b>Bold text</b>, <i>italic text</i>, etc."></textarea>
                        </div>
                        
                        <div class="message-preview">
                            <div class="preview-label">Preview</div>
                            <div id="messagePreview">Enter content to see preview...</div>
                        </div>
                        
                        <div class="form-row">
                            <button class="btn btn-secondary" onclick="app.previewBroadcast()">
                                <i class="fas fa-eye"></i> Preview
                            </button>
                            <button class="btn btn-primary" onclick="app.sendBroadcast()">
                                <i class="fas fa-paper-plane"></i> Send Now
                            </button>
                            <button class="btn btn-warning" onclick="app.scheduleBroadcast()">
                                <i class="fas fa-clock"></i> Schedule
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="table-container">
                    <div class="table-header">
                        <h3 class="table-title">Broadcast History</h3>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Target</th>
                                <th>Status</th>
                                <th>Scheduled</th>
                                <th>Sent</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.data.broadcasts.map(broadcast => `
                                <tr>
                                    <td>${broadcast.title}</td>
                                    <td>${broadcast.target}</td>
                                    <td><span class="status-badge status-${broadcast.status === 'sent' ? 'approved' : 'pending'}">${broadcast.status}</span></td>
                                    <td>${broadcast.scheduled_at ? new Date(broadcast.scheduled_at).toLocaleString() : '-'}</td>
                                    <td>${broadcast.sent_at ? new Date(broadcast.sent_at).toLocaleString() : '-'}</td>
                                    <td>
                                        <button class="btn btn-secondary btn-sm" onclick="app.viewBroadcast(${broadcast.id})">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="table-container">
                    <div class="table-header">
                        <h3 class="table-title">Auto Responses</h3>
                        <button class="btn btn-primary btn-sm" onclick="app.addAutoResponse()">
                            <i class="fas fa-plus"></i> Add Response
                        </button>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Trigger</th>
                                <th>Response</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.data.auto_responses.map(response => `
                                <tr>
                                    <td>${response.trigger_type}</td>
                                    <td><code>${response.trigger_value}</code></td>
                                    <td>${response.response.substring(0, 50)}${response.response.length > 50 ? '...' : ''}</td>
                                    <td><span class="status-badge status-${response.status === 'active' ? 'approved' : 'paused'}">${response.status}</span></td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="btn btn-secondary btn-sm" onclick="app.editAutoResponse(${response.id})">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-${response.status === 'active' ? 'warning' : 'success'} btn-sm" 
                                                    onclick="app.toggleAutoResponse(${response.id})">
                                                <i class="fas fa-${response.status === 'active' ? 'pause' : 'play'}"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderSettings() {
        return `
            <div class="content-header">
                <h1 class="content-title">System Settings</h1>
                <p class="content-subtitle">Configure system behavior and feature flags</p>
            </div>
            
            <div class="content-body">
                <div class="form-grid">
                    <div class="form-section">
                        <h3 class="section-title">Feature Flags</h3>
                        ${Object.entries(this.data.settings.feature_flags).map(([key, value]) => `
                            <div class="form-group">
                                <label class="form-label">
                                    <input type="checkbox" ${value ? 'checked' : ''} 
                                           onchange="app.toggleFeature('${key}', this.checked)">
                                    ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </label>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="form-section">
                        <h3 class="section-title">Branding</h3>
                        <div class="form-group">
                            <label class="form-label">Theme</label>
                            <select class="form-select">
                                <option value="neon-dark" selected>Neon Dark</option>
                                <option value="classic">Classic</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Primary Color</label>
                                <input type="color" class="form-input" value="${this.data.settings.branding.primary_color}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Accent Color</label>
                                <input type="color" class="form-input" value="${this.data.settings.branding.accent_color}">
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h3 class="section-title">Pagination</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Page Size</label>
                                <input type="number" class="form-input" value="${this.data.settings.pagination.page_size}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Max Results</label>
                                <input type="number" class="form-input" value="${this.data.settings.pagination.max_results}">
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h3 class="section-title">Save Changes</h3>
                        <button class="btn btn-primary" onclick="app.saveSettings()">
                            <i class="fas fa-save"></i> Save All Settings
                        </button>
                        <button class="btn btn-secondary" onclick="app.resetSettings()">
                            <i class="fas fa-undo"></i> Reset to Defaults
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderSystem() {
        return `
            <div class="content-header">
                <h1 class="content-title">System Tools</h1>
                <p class="content-subtitle">Deployment, maintenance, and monitoring tools</p>
            </div>
            
            <div class="content-body">
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <div class="card-header">
                            <span class="card-title">System Status</span>
                            <i class="fas fa-circle" style="color: var(--success);"></i>
                        </div>
                        <div class="card-value">Online</div>
                        <div class="card-change positive">All services running</div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-header">
                            <span class="card-title">Last Deploy</span>
                        </div>
                        <div class="card-value">Oct 27</div>
                        <div class="card-change">2:46 AM CDT</div>
                    </div>
                    
                    <div class="dashboard-card">
                        <div class="card-header">
                            <span class="card-title">Database</span>
                            <i class="fas fa-database" style="color: var(--primary);"></i>
                        </div>
                        <div class="card-value">Healthy</div>
                        <div class="card-change positive">0ms latency</div>
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-section">
                        <h3 class="section-title">Deployment</h3>
                        <button class="btn btn-primary" onclick="app.deploy()">
                            <i class="fas fa-rocket"></i> Deploy Changes
                        </button>
                        <button class="btn btn-warning" onclick="app.rollback()">
                            <i class="fas fa-undo"></i> Rollback
                        </button>
                        <button class="btn btn-secondary" onclick="app.viewDeployLogs()">
                            <i class="fas fa-file-alt"></i> View Deploy Logs
                        </button>
                    </div>
                    
                    <div class="form-section">
                        <h3 class="section-title">Services</h3>
                        <button class="btn btn-warning" onclick="app.restartNginx()">
                            <i class="fas fa-sync"></i> Restart Nginx
                        </button>
                        <button class="btn btn-warning" onclick="app.restartPhp()">
                            <i class="fas fa-sync"></i> Restart PHP-FPM
                        </button>
                        <button class="btn btn-warning" onclick="app.restartBot()">
                            <i class="fas fa-sync"></i> Restart Bot
                        </button>
                    </div>
                    
                    <div class="form-section">
                        <h3 class="section-title">Maintenance</h3>
                        <button class="btn btn-secondary" onclick="app.clearCache()">
                            <i class="fas fa-trash-alt"></i> Clear Cache
                        </button>
                        <button class="btn btn-primary" onclick="app.backup()">
                            <i class="fas fa-download"></i> Create Backup
                        </button>
                        <button class="btn btn-secondary" onclick="app.viewLogs()">
                            <i class="fas fa-list"></i> View System Logs
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Event Handlers
    attachLoginHandlers() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                this.login(username, password);
            });
        }
    }

    attachMainHandlers() {
        // Search functionality
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                // Implement search functionality here
                console.log('Search:', e.target.value);
            });
        });

        // Broadcast preview
        const broadcastContent = document.getElementById('broadcastContent');
        if (broadcastContent) {
            broadcastContent.addEventListener('input', (e) => {
                this.updateBroadcastPreview(e.target.value);
            });
        }
    }

    // Utility Methods
    updateBroadcastPreview(content) {
        const preview = document.getElementById('messagePreview');
        if (preview) {
            preview.innerHTML = content || 'Enter content to see preview...';
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Action Methods (simplified implementations for demo)
    toggleAffiliateStatus(id) {
        const affiliate = this.data.affiliates.find(a => a.id === id);
        if (affiliate) {
            affiliate.status = affiliate.status === 'active' ? 'paused' : 'active';
            this.showNotification(`Affiliate ${affiliate.status}`, 'success');
            this.render();
        }
    }

    deleteAffiliate(id) {
        if (confirm('Are you sure you want to delete this affiliate?')) {
            this.data.affiliates = this.data.affiliates.filter(a => a.id !== id);
            this.showNotification('Affiliate deleted', 'success');
            this.render();
        }
    }

    approveConversion(id) {
        const conversion = this.data.conversions.find(c => c.id === id);
        if (conversion) {
            conversion.status = 'approved';
            this.showNotification('Conversion approved', 'success');
            this.render();
        }
    }

    rejectConversion(id) {
        const conversion = this.data.conversions.find(c => c.id === id);
        if (conversion) {
            conversion.status = 'rejected';
            this.showNotification('Conversion rejected', 'warning');
            this.render();
        }
    }

    approvePayout(id) {
        const payout = this.data.payouts.find(p => p.id === id);
        if (payout) {
            payout.status = 'approved';
            payout.approved_at = new Date().toISOString();
            this.showNotification('Payout approved', 'success');
            this.render();
        }
    }

    sendBroadcast() {
        const title = document.getElementById('broadcastTitle')?.value;
        const content = document.getElementById('broadcastContent')?.value;
        const target = document.getElementById('broadcastTarget')?.value;
        
        if (!title || !content) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        // Simulate sending broadcast
        const newBroadcast = {
            id: Date.now(),
            title,
            content,
            target,
            status: 'sent',
            sent_at: new Date().toISOString()
        };
        
        this.data.broadcasts.unshift(newBroadcast);
        this.showNotification('Broadcast sent successfully!', 'success');
        
        // Clear form
        document.getElementById('broadcastTitle').value = '';
        document.getElementById('broadcastContent').value = '';
        this.updateBroadcastPreview('');
        
        this.render();
    }

    toggleFeature(feature, enabled) {
        this.data.settings.feature_flags[feature] = enabled;
        this.showNotification(`Feature ${enabled ? 'enabled' : 'disabled'}`, 'success');
    }

    deploy() {
        this.showNotification('Deployment started...', 'success');
        // Simulate deployment process
        setTimeout(() => {
            this.showNotification('Deployment completed!', 'success');
        }, 2000);
    }

    // Placeholder methods for various actions
    editAffiliate(id) { this.showNotification('Edit affiliate functionality', 'success'); }
    editCampaign(id) { this.showNotification('Edit campaign functionality', 'success'); }
    calculatePayouts() { this.showNotification('Calculating payouts...', 'success'); }
    updateBotConfig() { this.showNotification('Bot configuration updated', 'success'); }
    restartBot() { this.showNotification('Bot restarted', 'success'); }
    saveSettings() { this.showNotification('Settings saved', 'success'); }
    clearCache() { this.showNotification('Cache cleared', 'success'); }
    backup() { this.showNotification('Backup created', 'success'); }
}

// Initialize the application
const app = new GambleCodezAdmin();