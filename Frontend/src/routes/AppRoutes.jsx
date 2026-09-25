import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Common Components
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

// Public Pages
import HomePage from '../pages/public/HomePage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import UnauthorizedPage from '../pages/public/UnauthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';

// Protected Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentProfilePage from '../pages/student/StudentProfilePage';
import BrowseDrivesPage from '../pages/student/BrowseDrivesPage';
import DriveDetailsPage from '../pages/student/DriveDetailsPage';
import MyApplicationsPage from '../pages/student/MyApplicationsPage';
import ApplicationDetailsPage from '../pages/student/ApplicationDetailsPage';

// Protected Company Pages
import CompanyDashboard from '../pages/company/CompanyDashboard';
import CompanyProfilePage from '../pages/company/CompanyProfilePage';
import PostDrivePage from '../pages/company/PostDrivePage';
import ManageDrivesPage from '../pages/company/ManageDrivesPage';
import EditDrivePage from '../pages/company/EditDrivePage';
import DriveApplicantsPage from '../pages/company/DriveApplicantsPage';
import CompanyApplicationsPage from '../pages/company/CompanyApplicationsPage';

// Protected Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageStudentsPage from '../pages/admin/ManageStudentsPage';
import ManageCompaniesPage from '../pages/admin/ManageCompaniesPage';
import ManageAllDrivesPage from '../pages/admin/ManageAllDrivesPage';
import ReportsPage from '../pages/admin/ReportsPage';
import StudentDetailsPage from '../pages/admin/StudentDetailsPage';
import ManageApplicationsPage from '../pages/admin/ManageApplicationsPage';

const AppRoutes = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/drives"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <BrowseDrivesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/drives/:id"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <DriveDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/applications"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MyApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/applications/:id"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ApplicationDetailsPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Company Routes */}
          <Route
            path="/company"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <CompanyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/profile"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <CompanyProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/drives"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <ManageDrivesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/drives/new"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <PostDrivePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/drives/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <EditDrivePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/drives/:driveId/applicants"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <DriveApplicantsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company/applicants"
            element={
              <ProtectedRoute allowedRoles={['company']}>
                <CompanyApplicationsPage />
              </ProtectedRoute>
            }
          />
          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageStudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/:id"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <StudentDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/companies"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageCompaniesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/drives"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageAllDrivesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default AppRoutes;
