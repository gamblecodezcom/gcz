// Admin utilities for export, WebSocket, and validation

// Export to CSV
function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(",")
    )
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename || "export.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export to JSON
function exportToJSON(data, filename) {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename || "export.json");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// WebSocket connection for real-time updates
let adminSocket = null;

function connectAdminWebSocket(room) {
  if (adminSocket) {
    return adminSocket;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}`;
  
  adminSocket = io(wsUrl);
  
  adminSocket.on("connect", () => {
    console.log("Admin WebSocket connected");
    if (room) {
      adminSocket.emit("admin:subscribe", room);
    }
  });

  adminSocket.on("disconnect", () => {
    console.log("Admin WebSocket disconnected");
  });

  adminSocket.on("admin:update", (data) => {
    console.log("Admin update received:", data);
    // Trigger page refresh or update specific elements
    if (typeof window.onAdminUpdate === "function") {
      window.onAdminUpdate(data);
    }
  });

  return adminSocket;
}

// Form validation helpers
function validateRequired(value, fieldName) {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return `${fieldName} is required`;
  }
  return null;
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    return "Invalid email address";
  }
  return null;
}

function validateURL(url) {
  try {
    new URL(url);
    return null;
  } catch {
    return "Invalid URL";
  }
}

function validateNumber(value, min, max) {
  const num = Number(value);
  if (isNaN(num)) {
    return "Must be a number";
  }
  if (min !== undefined && num < min) {
    return `Must be at least ${min}`;
  }
  if (max !== undefined && num > max) {
    return `Must be at most ${max}`;
  }
  return null;
}

// Bulk selection helpers
function initBulkSelection(containerId, checkboxClass = "bulk-select") {
  const container = document.getElementById(containerId);
  if (!container) return;

  const selectAllCheckbox = container.querySelector(".select-all");
  const itemCheckboxes = container.querySelectorAll(`.${checkboxClass}`);

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", (e) => {
      itemCheckboxes.forEach(cb => {
        cb.checked = e.target.checked;
      });
      updateBulkActions();
    });
  }

  itemCheckboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      if (selectAllCheckbox) {
        selectAllCheckbox.checked = Array.from(itemCheckboxes).every(cb => cb.checked);
      }
      updateBulkActions();
    });
  });
}

function getSelectedIds(checkboxClass = "bulk-select") {
  return Array.from(document.querySelectorAll(`.${checkboxClass}:checked`))
    .map(cb => cb.dataset.id)
    .filter(id => id);
}

function updateBulkActions() {
  const selected = getSelectedIds();
  const bulkActions = document.querySelectorAll(".bulk-action");
  bulkActions.forEach(btn => {
    btn.disabled = selected.length === 0;
  });
}

// Permission checking helpers
let userPermissions = [];
let userRoles = [];

async function loadUserPermissions() {
  const sessionToken = localStorage.getItem('admin_session');
  if (!sessionToken) return;
  
  try {
    const response = await fetch('/api/admin/auth/me', {
      headers: { 'x-admin-session': sessionToken }
    });
    if (response.ok) {
      const data = await response.json();
      userPermissions = data.user.permissions || [];
      userRoles = data.user.roles || [];
    }
  } catch (error) {
    console.error('Error loading permissions:', error);
  }
}

function hasPermission(resource, action) {
  const permission = `${resource}:${action}`;
  return userPermissions.includes(permission);
}

function hasAnyPermission(permissions) {
  return permissions.some(perm => {
    if (typeof perm === 'string') {
      return userPermissions.includes(perm);
    }
    return hasPermission(perm.resource, perm.action);
  });
}

function hasRole(roleName) {
  return userRoles.some(role => role.name === roleName);
}

function isSuperAdmin() {
  return hasRole('super_admin');
}

// Auto-load permissions on page load
if (typeof window !== 'undefined') {
  loadUserPermissions();
}

// Make functions available globally
window.adminUtils = {
  exportToCSV,
  exportToJSON,
  connectAdminWebSocket,
  validateRequired,
  validateEmail,
  validateURL,
  validateNumber,
  initBulkSelection,
  getSelectedIds,
  updateBulkActions,
  hasPermission,
  hasAnyPermission,
  hasRole,
  isSuperAdmin,
  loadUserPermissions,
  getPermissions: () => userPermissions,
  getRoles: () => userRoles
};
