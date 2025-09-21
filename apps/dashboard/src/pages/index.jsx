import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Partners from "./Partners";
import PartnerDetails from "../components/PartnerDetails";

import Passholders from "./Passholders";

import Campaigns from "./Campaigns";

import Analytics from "./Analytics";

import CreateCampaign from "./CreateCampaign";
import CampaignDetails from "./CampaignDetails";

import RedemptionEditor from "./RedemptionEditor";
import MilestoneEditor from "./MilestoneEditor";
import PointsEditor from "./PointsEditor";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Partners: Partners,
    
    Passholders: Passholders,
    
    Campaigns: Campaigns,
    
    CreateCampaign: CreateCampaign,
    CampaignDetails: CampaignDetails,
    
    Analytics: Analytics,
    
    RedemptionEditor: RedemptionEditor,
    
    MilestoneEditor: MilestoneEditor,
    
    PointsEditor: PointsEditor,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Partners" element={<Partners />} />
                <Route path="/Partners/:id" element={<PartnerDetails />} />
                
                <Route path="/Passholders" element={<Passholders />} />
                
                <Route path="/Campaigns" element={<Campaigns />} />
                
                <Route path="/createcampaign" element={<CreateCampaign />} />
                <Route path="/campaigndetails" element={<CampaignDetails />} />
                
                {/* New campaign workflow routes */}
                <Route path="/campaigns/:campaignId/design" element={<RedemptionEditor />} />
                <Route path="/campaigns/:campaignId/details" element={<CampaignDetails />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                {/* Legacy editor routes */}
                <Route path="/editor/redemption" element={<RedemptionEditor />} />
                <Route path="/editor/milestone" element={<MilestoneEditor />} />
                <Route path="/editor/points" element={<PointsEditor />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}