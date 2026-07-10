import { useState, useCallback } from 'react';
import {
    fetchListings,
    fetchStats,
    fetchAlerts,
    updateListing,
    deleteListing,
    deleteAllListings,
} from '../services/api';

/**
 * Custom hook: useListings
 *
 * Centralise toute la logique data du dashboard :
 * - Chargement initial (listings + stats + alertes)
 * - Mise à jour d'une annonce
 * - Suppression d'une annonce
 * - Vider toutes les annonces
 *
 * Avantages :
 * - App.jsx devient un composant de présentation pur
 * - Logique testable indépendamment des composants
 * - Réutilisable dans d'autres vues (ex: page stats future)
 *
 * @returns {{ listings, stats, alertsData, loading, error, loadData, updateListingById, deleteListingById, clearAll }}
 */
export function useListings() {
    const [listings, setListings] = useState([]);
    const [stats, setStats] = useState(null);
    const [alertsData, setAlertsData] = useState({ alerts: [], summary: null, history: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Recharge uniquement les stats et alertes (après update/delete)
    const reloadStats = useCallback(async () => {
        const [statsData, alertsPayload] = await Promise.all([
            fetchStats(),
            fetchAlerts({ limit: 5 }),
        ]);
        setStats(statsData);
        setAlertsData(alertsPayload);
    }, []);

    // Chargement complet : listings + stats + alertes
    const loadData = useCallback(async ({ showLoading = true } = {}) => {
        try {
            if (showLoading) setLoading(true);
            const [listingsData, statsData, alertsPayload] = await Promise.all([
                fetchListings({ limit: 500 }),
                fetchStats(),
                fetchAlerts({ limit: 5 }),
            ]);
            setListings(listingsData);
            setStats(statsData);
            setAlertsData(alertsPayload);
            return listingsData;
        } catch (err) {
            setError(err.message);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    // Mise à jour optimiste : met à jour l'état local immédiatement,
    // puis recharge les stats pour les compteurs
    const updateListingById = useCallback(async (id, updates) => {
        const updated = await updateListing(id, updates);
        setListings(prev => prev.map(l => l.id === id ? updated : l));
        await reloadStats();
        return updated;
    }, [reloadStats]);

    // Suppression optimiste : retire de la liste locale, puis recharge les stats
    const deleteListingById = useCallback(async (id) => {
        await deleteListing(id);
        setListings(prev => prev.filter(l => l.id !== id));
        await reloadStats();
    }, [reloadStats]);

    // Vider tout le dashboard
    const clearAll = useCallback(async () => {
        const result = await deleteAllListings();
        setListings([]);
        await reloadStats();
        return result;
    }, [reloadStats]);

    return {
        listings,
        stats,
        alertsData,
        loading,
        error,
        loadData,
        updateListingById,
        deleteListingById,
        clearAll,
    };
}
