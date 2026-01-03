
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "../ui/card";
import {
    Pencil,
    Save,
    X,
    Plus
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { ImageUpload } from "../ui/ImageUpload";
import { SeriesService } from "../../services/series.service";
import { Series } from "../../types/series";

export default function SeriesInfoTab() {
    const { seriesId } = useParams();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // --- State Management ---

    // Basic Info
    const [seriesName, setSeriesName] = useState("");
    const [shortName, setShortName] = useState("");
    const [fantasyName, setFantasyName] = useState("");
    const [fantasyShortName, setFantasyShortName] = useState("");
    const [key, setKey] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Images
    const [seriesImage, setSeriesImage] = useState<File | null>(null);
    const [seriesImageUrl, setSeriesImageUrl] = useState<string>("");
    const [featuredImage, setFeaturedImage] = useState<File | null>(null);
    const [featuredImageUrl, setFeaturedImageUrl] = useState<string>("");

    // Classification
    const [seriesType, setSeriesType] = useState<"International" | "Domestic" | "League" | "Women">("International");
    const [gender, setGender] = useState<"Male" | "Female">("Male");
    const [activeFormat, setActiveFormat] = useState<"ODI" | "T20" | "Test" | "T10" | "100B">("T20");
    const [formats, setFormats] = useState({
        t20: false,
        odi: false,
        test: false,
        t10: false,
        hundred: false
    });
    const [tournamentType, setTournamentType] = useState("");
    const [bracketType, setBracketType] = useState("");

    // Configuration
    const [configs, setConfigs] = useState({
        dontShowOnApp: false,
        toursOnlyTwoTeams: false,
        isFeatured: false,
        onHome: false,
        allowSquadMultiple: false
    });

    // Feature flags
    const [hasSquad, setHasSquad] = useState(false);
    const [hasFixtures, setHasFixtures] = useState(false);
    const [hasPoints, setHasPoints] = useState(false);

    const [drsSystem, setDrsSystem] = useState<number>(0);

    // Status
    const [status, setStatus] = useState<"Running" | "Finished" | "Upcoming" | "Scheduled">("Scheduled");

    // Notification flags
    const [oddsNotification, setOddsNotification] = useState(false);
    const [perNotification, setPerNotification] = useState(false);

    // Associations
    const [defaultNotification, setDefaultNotification] = useState("");
    const [broadcaster, setBroadcaster] = useState("");
    const [hostTeam, setHostTeam] = useState("");

    // Load series data
    useEffect(() => {
        if (seriesId) {
            loadSeries();
        }
    }, [seriesId]);

    const loadSeries = async () => {
        if (!seriesId) return;
        
        try {
            setLoading(true);
            const response = await SeriesService.getSeries(seriesId);
            const series: Series = response.data.result;
            
            // Populate form fields
            setSeriesName(series.name || "");
            setShortName(series.shortName || "");
            setFantasyName(series.fantasyName || "");
            setFantasyShortName(series.fantasyShortName || "");
            setKey(series.key || "");
            setStartDate(series.startDate ? new Date(series.startDate).toISOString().split('T')[0] : "");
            setEndDate(series.endDate ? new Date(series.endDate).toISOString().split('T')[0] : "");
            setSeriesImageUrl(series.seriesImage || "");
            setFeaturedImageUrl(series.featuredImage || "");
            setSeriesType(series.seriesType as any || "International");
            setGender(series.gender as any || "Male");
            setActiveFormat(series.activeFormat as any || "T20");
            setFormats({
                t20: series.formats?.t20 || false,
                odi: series.formats?.odi || false,
                test: series.formats?.test || false,
                t10: series.formats?.t10 || false,
                hundred: series.formats?.hundred || false
            });
            setTournamentType(series.tournamentType || "");
            setBracketType(series.bracketType || "");
            setDrsSystem(series.drsSystem || 0);
            setStatus(series.status as any || "Scheduled");
            setConfigs({
                dontShowOnApp: series.dontShowOnApp || false,
                toursOnlyTwoTeams: series.toursOnlyTwoTeams || false,
                isFeatured: series.isFeatured || false,
                onHome: series.onHome || false,
                allowSquadMultiple: series.allowSquadMultiple || false
            });
            setHasSquad(series.hasSquad || false);
            setHasFixtures(series.hasFixtures || false);
            setHasPoints(series.hasPoints || false);
            setOddsNotification(series.oddsNotification || false);
            setPerNotification(series.perNotification || false);
            setDefaultNotification(series.defaultNotification?.toString() || "");
            setBroadcaster(series.broadcaster?.toString() || "");
            setHostTeam(series.hostTeam?.toString() || "");
        } catch (error: any) {
            console.error('Failed to load series:', error);
            toast.error('Failed to load series information');
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    const handleFormatChange = (key: keyof typeof formats) => {
        if (!isEditing) return;
        setFormats(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleConfigChange = (key: keyof typeof configs) => {
        if (!isEditing) return;
        setConfigs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        if (!seriesId) return;
        
        // Validation
        if (!seriesName.trim()) {
            toast.error('Series name is required');
            return;
        }
        if (!shortName.trim()) {
            toast.error('Short name is required');
            return;
        }
        if (!key.trim()) {
            toast.error('Key is required');
            return;
        }
        if (!startDate || !endDate) {
            toast.error('Start date and end date are required');
            return;
        }

        try {
            setSaving(true);
            
            // Build payload matching backend DTO
            const payload: any = {
                name: seriesName.trim(),
                shortName: shortName.trim(),
                key: key.trim().toUpperCase(), // Key should be uppercase
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                seriesType: seriesType,
                gender: gender,
                activeFormat: activeFormat,
                formats: {
                    t20: formats.t20,
                    odi: formats.odi,
                    test: formats.test,
                    t10: formats.t10,
                    hundred: formats.hundred
                },
                dontShowOnApp: configs.dontShowOnApp,
                toursOnlyTwoTeams: configs.toursOnlyTwoTeams,
                isFeatured: configs.isFeatured,
                onHome: configs.onHome,
                allowSquadMultiple: configs.allowSquadMultiple,
                drsSystem: drsSystem,
                status: status,
                oddsNotification: oddsNotification,
                perNotification: perNotification,
                hasSquad: hasSquad,
                hasFixtures: hasFixtures,
                hasPoints: hasPoints,
            };

            // Helper function to validate MongoDB ObjectId
            const isValidObjectId = (id: string): boolean => {
                if (!id || typeof id !== 'string') return false;
                // MongoDB ObjectId is 24 hex characters
                return /^[0-9a-fA-F]{24}$/.test(id);
            };

            // Optional fields
            if (fantasyName.trim()) payload.fantasyName = fantasyName.trim();
            if (fantasyShortName.trim()) payload.fantasyShortName = fantasyShortName.trim();
            if (seriesImageUrl) payload.seriesImage = seriesImageUrl;
            if (featuredImageUrl) payload.featuredImage = featuredImageUrl;
            if (tournamentType) payload.tournamentType = tournamentType;
            if (bracketType) payload.bracketType = bracketType;
            
            // Only send if valid MongoDB ObjectId
            if (defaultNotification && isValidObjectId(defaultNotification)) {
                payload.defaultNotification = defaultNotification;
            }
            if (broadcaster && isValidObjectId(broadcaster)) {
                payload.broadcaster = broadcaster;
            }
            if (hostTeam && isValidObjectId(hostTeam)) {
                payload.hostTeam = hostTeam;
            }

            const response = await SeriesService.updateSeries(seriesId, payload);
            
            if (response.status) {
                toast.success('Series updated successfully');
                setIsEditing(false);
                await loadSeries(); // Reload to get updated data
            }
        } catch (error: any) {
            console.error('Failed to update series:', error);
            const errorMsg = error.response?.data?.userMessage || error.response?.data?.developerMessage || 'Failed to update series';
            toast.error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        // Reload original data
        loadSeries();
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="size-5 animate-spin" />
                    <span>Loading series information...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-4 max-w-5xl mx-auto pb-20">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                    <div className="space-y-1">
                        <CardTitle className="text-xl">Series Information</CardTitle>
                        <CardDescription>General details about the current series</CardDescription>
                    </div>
                    {!isEditing && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="gap-2"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit Info
                        </Button>
                    )}
                    {isEditing && (
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancel}
                                className="gap-2"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {/* Persistent Form View (Disabled by Default) */}
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">

                        {/* 1. Images Section (Side-by-Side) */}
                        <div className={`flex flex-row md:flex-row gap-10 ${!isEditing ? "opacity-60 pointer-events-none" : ""}`}>
                            <div className="flex flex-col gap-3 w-full md:w-1/3">
                                <Label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Upload Image for Series</Label>
                                <div className="w-40">
                                    <ImageUpload
                                        value={seriesImageUrl}
                                        onChange={(url) => setSeriesImageUrl(url)}
                                        onFileSelect={(file) => setSeriesImage(file)}
                                        className="w-full aspect-square rounded-full md:rounded-lg"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 w-full md:w-1/3">
                                <Label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Upload Image for featured series</Label>
                                <div className="w-56">
                                    <ImageUpload
                                        value={featuredImageUrl}
                                        onChange={(url) => setFeaturedImageUrl(url)}
                                        onFileSelect={(file) => setFeaturedImage(file)}
                                        className="w-full aspect-video"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Basic Details (Stacked Inputs) */}
                        <div className="space-y-6 max-w-3xl">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SERIES NAME *</Label>
                                <Input
                                    disabled={!isEditing}
                                    value={seriesName}
                                    onChange={(e) => setSeriesName(e.target.value)}
                                    className="border-0 border-b border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent placeholder:text-slate-300 disabled:opacity-70 disabled:cursor-not-allowed"
                                    placeholder="Enter series name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SERIES SHORT NAME *</Label>
                                <Input
                                    disabled={!isEditing}
                                    value={shortName}
                                    onChange={(e) => setShortName(e.target.value)}
                                    className="border-0 border-b border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent placeholder:text-slate-300 disabled:opacity-70 disabled:cursor-not-allowed"
                                    placeholder="Enter short name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SERIES FANTASY NAME *</Label>
                                <Input
                                    disabled={!isEditing}
                                    value={fantasyName}
                                    onChange={(e) => setFantasyName(e.target.value)}
                                    className="border-0 border-b border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent placeholder:text-slate-300 disabled:opacity-70 disabled:cursor-not-allowed"
                                    placeholder="Enter fantasy name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SERIES FANTASY SHORT NAME</Label>
                                <Input
                                    disabled={!isEditing}
                                    value={fantasyShortName}
                                    onChange={(e) => setFantasyShortName(e.target.value)}
                                    className="border-0 border-b border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent placeholder:text-slate-300 disabled:opacity-70 disabled:cursor-not-allowed"
                                    placeholder="Enter fantasy short name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">KEY *</Label>
                                <Input
                                    disabled={!isEditing}
                                    value={key}
                                    onChange={(e) => setKey(e.target.value.toUpperCase())}
                                    className="border-0 border-b border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent placeholder:text-slate-300 disabled:opacity-70 disabled:cursor-not-allowed"
                                    placeholder="Enter unique key (e.g., IPL2024)"
                                />
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-3xl pt-2">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">START DATE</Label>
                                <div className="relative">
                                    <Input
                                        disabled={!isEditing}
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-slate-50 border-slate-200 disabled:opacity-70 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">END DATE</Label>
                                <div className="relative">
                                    <Input
                                        disabled={!isEditing}
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-slate-50 border-slate-200 disabled:opacity-70 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Classifications, Configs & Associations (Table Layout) */}
                        <div className="space-y-8 pt-6">

                            {/* Formats Row */}
                            <div className="w-full">
                                <table className="w-full">
                                    <tbody>
                                        <tr className="border-b border-transparent">
                                            <td className="w-48 align-top py-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Format</Label>
                                            </td>
                                            <td className="align-top py-2">
                                                <div className="flex flex-wrap gap-x-8 gap-y-4">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox id="fmt-t20" checked={formats.t20} onCheckedChange={() => handleFormatChange('t20')} disabled={!isEditing} />
                                                        <Label htmlFor="fmt-t20" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>T20</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox id="fmt-odi" checked={formats.odi} onCheckedChange={() => handleFormatChange('odi')} disabled={!isEditing} />
                                                        <Label htmlFor="fmt-odi" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>ODI</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox id="fmt-test" checked={formats.test} onCheckedChange={() => handleFormatChange('test')} disabled={!isEditing} />
                                                        <Label htmlFor="fmt-test" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Test</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox id="fmt-t10" checked={formats.t10} onCheckedChange={() => handleFormatChange('t10')} disabled={!isEditing} />
                                                        <Label htmlFor="fmt-t10" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>T10</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox id="fmt-100" checked={formats.hundred} onCheckedChange={() => handleFormatChange('hundred')} disabled={!isEditing} />
                                                        <Label htmlFor="fmt-100" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Hundred Balls</Label>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Type Row */}
                            <div className="w-full">
                                <table className="w-full">
                                    <tbody>
                                        <tr className="border-b border-transparent">
                                            <td className="w-48 align-top py-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</Label>
                                            </td>
                                            <td className="align-top py-2">
                                                <RadioGroup
                                                    disabled={!isEditing}
                                                    value={seriesType}
                                                    onValueChange={setSeriesType}
                                                    className="flex flex-wrap gap-x-8 gap-y-4"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="International" id="type-int" />
                                                        <Label htmlFor="type-int" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>International</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="Domestic" id="type-dom" />
                                                        <Label htmlFor="type-dom" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Domestic</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="League" id="type-league" />
                                                        <Label htmlFor="type-league" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>League</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="Women" id="type-women" />
                                                        <Label htmlFor="type-women" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Women</Label>
                                                    </div>
                                                </RadioGroup>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Gender Row */}
                            <div className="w-full">
                                <table className="w-full">
                                    <tbody>
                                        <tr className="border-b border-transparent">
                                            <td className="w-48 align-top py-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gender</Label>
                                            </td>
                                            <td className="align-top py-2">
                                                <RadioGroup
                                                    disabled={!isEditing}
                                                    value={gender}
                                                    onValueChange={setGender}
                                                    className="flex flex-wrap gap-x-8 gap-y-4"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="Male" id="gd-male" />
                                                        <Label htmlFor="gd-male" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Male</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="Female" id="gd-female" />
                                                        <Label htmlFor="gd-female" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Female</Label>
                                                    </div>
                                                </RadioGroup>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Active Format Row */}
                            <div className="w-full">
                                <table className="w-full">
                                    <tbody>
                                        <tr className="border-b border-transparent">
                                            <td className="w-48 align-top py-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Format</Label>
                                            </td>
                                            <td className="align-top py-2">
                                                <RadioGroup
                                                    disabled={!isEditing}
                                                    value={activeFormat}
                                                    onValueChange={setActiveFormat}
                                                    className="flex flex-wrap gap-x-8 gap-y-4"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="ODI" id="af-odi" />
                                                        <Label htmlFor="af-odi" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>ODI</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="T20" id="af-t20" />
                                                        <Label htmlFor="af-t20" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>T20</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="Test" id="af-test" />
                                                        <Label htmlFor="af-test" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Test</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="T10" id="af-t10" />
                                                        <Label htmlFor="af-t10" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>T10</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="100B" id="af-100b" />
                                                        <Label htmlFor="af-100b" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Hundred Balls</Label>
                                                    </div>
                                                </RadioGroup>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Status Row */}
                            <div className="w-full">
                                <table className="w-full">
                                    <tbody>
                                        <tr className="border-b border-transparent">
                                            <td className="w-48 align-top py-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</Label>
                                            </td>
                                            <td className="align-top py-2">
                                                <RadioGroup
                                                    disabled={!isEditing}
                                                    value={status}
                                                    onValueChange={(value) => setStatus(value as any)}
                                                    className="flex flex-wrap gap-x-8 gap-y-4"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="Scheduled" id="st-scheduled" />
                                                        <Label htmlFor="st-scheduled" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Scheduled</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="Upcoming" id="st-upcoming" />
                                                        <Label htmlFor="st-upcoming" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Upcoming</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="Running" id="st-running" />
                                                        <Label htmlFor="st-running" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Running</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="Finished" id="st-finished" />
                                                        <Label htmlFor="st-finished" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Finished</Label>
                                                    </div>
                                                </RadioGroup>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Configs Row */}
                            <div className="w-full">
                                <table className="w-full">
                                    <tbody>
                                        <tr className="border-b border-transparent">
                                            <td className="w-48 align-top py-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configurations</Label>
                                            </td>
                                            <td className="align-top py-2">
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex flex-wrap gap-6">
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="dont-show"
                                                                checked={configs.dontShowOnApp}
                                                                onCheckedChange={() => handleConfigChange('dontShowOnApp')}
                                                                disabled={!isEditing}
                                                            />
                                                            <Label htmlFor="dont-show" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Don't Show On CE11</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="tours-only"
                                                                checked={configs.toursOnlyTwoTeams}
                                                                onCheckedChange={() => handleConfigChange('toursOnlyTwoTeams')}
                                                                disabled={!isEditing}
                                                            />
                                                            <Label htmlFor="tours-only" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>IS TOUR(ONLY TWO TEAMS)</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="featured"
                                                                checked={configs.isFeatured}
                                                                onCheckedChange={() => handleConfigChange('isFeatured')}
                                                                disabled={!isEditing}
                                                            />
                                                            <Label htmlFor="featured" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Is Featured Series</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="home-page"
                                                                checked={configs.onHome}
                                                                onCheckedChange={() => handleConfigChange('onHome')}
                                                                disabled={!isEditing}
                                                            />
                                                            <Label htmlFor="home-page" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>On OneCricket Home</Label>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="multi-squad"
                                                            checked={configs.allowSquadMultiple}
                                                            onCheckedChange={() => handleConfigChange('allowSquadMultiple')}
                                                            disabled={!isEditing}
                                                        />
                                                        <Label htmlFor="multi-squad" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Allow Squad in Multiple Teams</Label>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Feature Flags Row */}
                            <div className="w-full">
                                <table className="w-full">
                                    <tbody>
                                        <tr className="border-b border-transparent">
                                            <td className="w-48 align-top py-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Feature Flags</Label>
                                            </td>
                                            <td className="align-top py-2">
                                                <div className="flex flex-wrap gap-6">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="has-squad"
                                                            checked={hasSquad}
                                                            onCheckedChange={(checked) => setHasSquad(!!checked)}
                                                            disabled={!isEditing}
                                                        />
                                                        <Label htmlFor="has-squad" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Squad Management (Sq)</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="has-fixtures"
                                                            checked={hasFixtures}
                                                            onCheckedChange={(checked) => setHasFixtures(!!checked)}
                                                            disabled={!isEditing}
                                                        />
                                                        <Label htmlFor="has-fixtures" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Fixtures (Fix)</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="has-points"
                                                            checked={hasPoints}
                                                            onCheckedChange={(checked) => setHasPoints(!!checked)}
                                                            disabled={!isEditing}
                                                        />
                                                        <Label htmlFor="has-points" className={`mx-2 font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>Points Table (Pt)</Label>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Associations Group */}
                            <div className="w-full">
                                <table className="w-full">
                                    <tbody>
                                        <tr className="border-b border-transparent">
                                            <td className="w-48 align-top py-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Others</Label>
                                            </td>
                                            <td className="align-top py-2">
                                                <div className="space-y-4 max-w-2xl">
                                                    <div className="flex flex-col md:flex-row gap-4">
                                                        <div className="flex-1 space-y-1">
                                                            <Label className="text-xs text-slate-400">Default Notification (MongoDB ID)</Label>
                                                            <Input
                                                                value={defaultNotification}
                                                                onChange={(e) => setDefaultNotification(e.target.value)}
                                                                disabled={!isEditing}
                                                                placeholder="Enter Notification ObjectId (24 hex chars)"
                                                                className="disabled:opacity-70 disabled:bg-slate-50 font-mono text-xs"
                                                            />
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <Label className="text-xs text-slate-400">Broadcaster (MongoDB ID)</Label>
                                                            <Input
                                                                value={broadcaster}
                                                                onChange={(e) => setBroadcaster(e.target.value)}
                                                                disabled={!isEditing}
                                                                placeholder="Enter Broadcaster ObjectId (24 hex chars)"
                                                                className="disabled:opacity-70 disabled:bg-slate-50 font-mono text-xs"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col md:flex-row gap-4">
                                                        <div className="flex-1 space-y-1">
                                                            <Label className="text-xs text-slate-400">Tournament Type</Label>
                                                            <Select value={tournamentType} onValueChange={setTournamentType} disabled={!isEditing}>
                                                                <SelectTrigger className="disabled:opacity-70 disabled:bg-slate-50">
                                                                    <SelectValue placeholder="Select Type" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="knockout">Knockout</SelectItem>
                                                                    <SelectItem value="league">League</SelectItem>
                                                                    <SelectItem value="bilateral">Bilateral</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <Label className="text-xs text-slate-400">Host Team (MongoDB ID)</Label>
                                                            <Input
                                                                value={hostTeam}
                                                                onChange={(e) => setHostTeam(e.target.value)}
                                                                disabled={!isEditing}
                                                                placeholder="Enter Team ObjectId (24 hex chars)"
                                                                className="disabled:opacity-70 disabled:bg-slate-50 font-mono text-xs"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 space-y-1 w-full md:w-1/2">
                                                        <Label className="text-xs text-slate-400">DRS System (0-2)</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="2"
                                                            value={drsSystem}
                                                            onChange={(e) => setDrsSystem(parseInt(e.target.value) || 0)}
                                                            disabled={!isEditing}
                                                            className="disabled:opacity-70 disabled:bg-slate-50"
                                                        />
                                                    </div>

                                                    {/* Notification Flags */}
                                                    <div className="w-full space-y-3 pt-2">
                                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notifications</Label>
                                                        <div className="flex flex-wrap gap-6">
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id="odds-notification"
                                                                    checked={oddsNotification}
                                                                    onCheckedChange={(checked) => setOddsNotification(!!checked)}
                                                                    disabled={!isEditing}
                                                                />
                                                                <Label htmlFor="odds-notification" className={`text-sm font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>
                                                                    Odds Notification
                                                                </Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id="per-notification"
                                                                    checked={perNotification}
                                                                    onCheckedChange={(checked) => setPerNotification(!!checked)}
                                                                    disabled={!isEditing}
                                                                />
                                                                <Label htmlFor="per-notification" className={`text-sm font-normal cursor-pointer ${!isEditing ? "opacity-50 cursor-not-allowed" : "opacity-80"}`}>
                                                                    Per/Percentage Notification
                                                                </Label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
