import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { ChecklistsPage } from "./pages/ChecklistsPage";
import { ConfigurationsPage } from "./pages/ConfigurationsPage";
import { ContactsPage } from "./pages/ContactsPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { DomainTrackerPage } from "./pages/DomainTrackerPage";
import { LicensesPage } from "./pages/LicensesPage";
import { LocationsPage } from "./pages/LocationsPage";
import { EditPasswordPage } from "./pages/EditPasswordPage";
import { PasswordDetailPage } from "./pages/PasswordDetailPage";
import { PasswordsPage } from "./pages/PasswordsPage";
import { SslTrackerPage } from "./pages/SslTrackerPage";
import { WirelessPage } from "./pages/WirelessPage";
import { CreateOrganizationPage } from "./pages/CreateOrganizationPage";
import { EditQuickNotesPage } from "./pages/EditQuickNotesPage";
import { OrganizationDetailPage } from "./pages/OrganizationDetailPage";
import { OrganizationsPage } from "./pages/OrganizationsPage";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8 text-center text-gray-500">
      {title} — coming soon
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="organizations" element={<OrganizationsPage />} />
          <Route path="organizations/new" element={<CreateOrganizationPage />} />
          <Route path="organizations/:id/edit" element={<CreateOrganizationPage />} />
          <Route
            path="organizations/:id/quick-notes/edit"
            element={<EditQuickNotesPage />}
          />
          <Route path="organizations/:id/checklists" element={<ChecklistsPage />} />
          <Route
            path="organizations/:id/configurations"
            element={<ConfigurationsPage />}
          />
          <Route path="organizations/:id/contacts" element={<ContactsPage />} />
          <Route
            path="organizations/:id/documents/folders/:folderId"
            element={<DocumentsPage />}
          />
          <Route path="organizations/:id/documents" element={<DocumentsPage />} />
          <Route
            path="organizations/:id/domain_tracker"
            element={<DomainTrackerPage />}
          />
          <Route path="organizations/:id/locations" element={<LocationsPage />} />
          <Route path="organizations/:id/licenses" element={<LicensesPage />} />
          <Route
            path="organizations/:id/passwords/items/:itemId/edit"
            element={<EditPasswordPage />}
          />
          <Route
            path="organizations/:id/passwords/items/:itemId"
            element={<PasswordDetailPage />}
          />
          <Route
            path="organizations/:id/passwords/folders/:folderId"
            element={<PasswordsPage />}
          />
          <Route path="organizations/:id/passwords" element={<PasswordsPage />} />
          <Route
            path="organizations/:id/ssl_tracker"
            element={<SslTrackerPage />}
          />
          <Route path="organizations/:id/wireless" element={<WirelessPage />} />
          <Route path="organizations/:id" element={<OrganizationDetailPage />} />
          <Route path="personal" element={<PlaceholderPage title="Personal" />} />
          <Route path="global" element={<PlaceholderPage title="Global Search" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
