
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Plus, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
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
import { toast } from "sonner";

export function SeriesCreateView() {
    const navigate = useNavigate();

    // --- State Management ---

    // Basic Info
    const [seriesName, setSeriesName] = useState("");
    const [shortName, setShortName] = useState("");
    const [fantasyName, setFantasyName] = useState("");
    const [fantasyShortName, setFantasyShortName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Images
    const [seriesImage, setSeriesImage] = useState<File | null>(null);
    const [seriesImageUrl, setSeriesImageUrl] = useState<string>("");
    const [featuredImage, setFeaturedImage] = useState<File | null>(null);
    const [featuredImageUrl, setFeaturedImageUrl] = useState<string>("");

    // Classification
    const [seriesType, setSeriesType] = useState("International");
    const [gender, setGender] = useState("Male");
    const [activeFormat, setActiveFormat] = useState("T20");
    const [formats, setFormats] = useState({
        t20: true,
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

    const [drsSystem, setDrsSystem] = useState("0");

    // Status
    const [status, setStatus] = useState<"Running" | "Finished" | "Upcoming" | "Scheduled">("Scheduled");

    // Notification flags
    const [oddsNotification, setOddsNotification] = useState(false);
    const [perNotification, setPerNotification] = useState(false);

    // Feature flags
    const [hasSquad, setHasSquad] = useState(false);
    const [hasFixtures, setHasFixtures] = useState(false);
    const [hasPoints, setHasPoints] = useState(false);

    // Associations
    const [defaultNotification, setDefaultNotification] = useState("");
    const [broadcaster, setBroadcaster] = useState("");
    const [hostTeam, setHostTeam] = useState("");

    // Loading state
    const [saving, setSaving] = useState(false);

    // Handlers
    const handleFormatChange = (key: keyof typeof formats) => {
        setFormats(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleConfigChange = (key: keyof typeof configs) => {
        setConfigs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        try {
            // Validation
            if (!seriesName.trim()) {
                toast.error('Series name is required');
                return;
            }
            if (!shortName.trim()) {
                toast.error('Short name is required');
                return;
            }
            if (!startDate || !endDate) {
                toast.error('Start date and end date are required');
                return;
            }
            
            // Validate required enum fields
            if (!seriesType) {
                toast.error('Series type is required');
                return;
            }
            if (!gender) {
                toast.error('Gender is required');
                return;
            }
            if (!activeFormat) {
                toast.error('Active format is required');
                return;
            }

            setSaving(true);

            // Generate key from series name if not provided
            const seriesKey = seriesName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 20) + new Date().getFullYear();

            // Build request payload matching backend DTO
            const payload: any = {
                name: seriesName.trim(),
                shortName: shortName.trim(),
                key: seriesKey.toUpperCase(), // Key must be uppercase and unique
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                seriesType: seriesType, // 'International', 'Domestic', 'League', 'Women'
                gender: gender, // 'Male', 'Female'
                activeFormat: activeFormat, // 'ODI', 'T20', 'Test', 'T10', '100B'
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
                drsSystem: parseInt(drsSystem) || 0,
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
            if (fantasyName?.trim()) payload.fantasyName = fantasyName.trim();
            if (fantasyShortName?.trim()) payload.fantasyShortName = fantasyShortName.trim();
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

            // TODO: Handle image uploads when upload API is ready
            // For now, we'll skip images

            const response = await SeriesService.createSeries(payload);

            if (response.status) {
                toast.success('Series created successfully');
                navigate(`/series/${response.data.result._id}`);
            }
        } catch (error: any) {
            console.error('Failed to create series:', error);
            console.error('Error response:', error.response?.data);
            
            // Handle validation errors from backend
            const errorData = error.response?.data;
            if (errorData) {
                let errorMessage = '';
                
                // Check for array of validation messages
                if (Array.isArray(errorData.userMessage)) {
                    errorMessage = errorData.userMessage
                        .filter((msg: string) => msg && typeof msg === 'string')
                        .map((msg: string) => {
                            // Clean up validation messages
                            if (msg.includes('should not exist')) {
                                return `Invalid field: ${msg.replace('property ', '').replace(' should not exist', '')}`;
                            }
                            if (msg.includes('must be')) {
                                return msg;
                            }
                            if (msg.includes('should not be empty')) {
                                return msg.replace('should not be empty', 'is required');
                            }
                            return msg;
                        })
                        .join('. ');
                } else if (typeof errorData.userMessage === 'string') {
                    errorMessage = errorData.userMessage;
                } else if (Array.isArray(errorData.developerMessage)) {
                    errorMessage = errorData.developerMessage
                        .filter((msg: string) => msg && typeof msg === 'string')
                        .join('. ');
                } else if (typeof errorData.developerMessage === 'string') {
                    errorMessage = errorData.developerMessage;
                }
                
                if (errorMessage) {
                    toast.error(errorMessage);
                } else {
                    toast.error('Failed to create series. Please check all required fields are filled correctly.');
                }
            } else {
                toast.error('Failed to create series. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate("/series")}>
                        Series
                    </span>
                    <span>/</span>
                    <span className="text-slate-900 dark:text-white font-medium">Add New Series</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/series")}
                            className="h-8 w-8"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Create New Series
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={() => navigate("/series")}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button 
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Series
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Form Card */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardContent className="p-8 space-y-8">

                    {/* 1. Images Section (Side-by-Side) */}
                    <div className="flex flex-row md:flex-row gap-10">
                        <div className="flex flex-col gap-3 w-full md:w-1/3">
                            <Label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Upload Image for Series</Label>
                            <div className="w-40">
                                <ImageUpload
                                    value={seriesImageUrl}
                                    onChange={(url) => setSeriesImageUrl(url)}
                                    onFileSelect={(file) => setSeriesImage(file)}
                                    className="w-full aspect-square rounded-full md:rounded-lg" // Keeping generic style, adjusted via class if needed
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
                                value={seriesName}
                                onChange={(e) => setSeriesName(e.target.value)}
                                className="border-0 border-b border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent placeholder:text-slate-300"
                                placeholder="Enter series name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SERIES SHORT NAME *</Label>
                            <Input
                                value={shortName}
                                onChange={(e) => setShortName(e.target.value)}
                                className="border-0 border-b border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent placeholder:text-slate-300"
                                placeholder="Enter short name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SERIES FANTASY NAME *</Label>
                            <Input
                                value={fantasyName}
                                onChange={(e) => setFantasyName(e.target.value)}
                                className="border-0 border-b border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent placeholder:text-slate-300"
                                placeholder="Enter fantasy name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SERIES FANTASY SHORT NAME</Label>
                            <Input
                                value={fantasyShortName}
                                onChange={(e) => setFantasyShortName(e.target.value)}
                                className="border-0 border-b border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-500 bg-transparent placeholder:text-slate-300"
                                placeholder="Enter fantasy short name"
                            />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-3xl pt-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">START DATE</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">END DATE</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Classifications (Label - Row Layout) */}
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
                                                    <Checkbox id="fmt-t20" checked={formats.t20} onCheckedChange={() => handleFormatChange('t20')} />
                                                    <Label htmlFor="fmt-t20" className="mx-2 opacity-80 font-normal cursor-pointer">T20</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="fmt-odi" checked={formats.odi} onCheckedChange={() => handleFormatChange('odi')} />
                                                    <Label htmlFor="fmt-odi" className="mx-2 opacity-80 font-normal cursor-pointer">ODI</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="fmt-test" checked={formats.test} onCheckedChange={() => handleFormatChange('test')} />
                                                    <Label htmlFor="fmt-test" className="mx-2 opacity-80 font-normal cursor-pointer">Test</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="fmt-t10" checked={formats.t10} onCheckedChange={() => handleFormatChange('t10')} />
                                                    <Label htmlFor="fmt-t10" className="mx-2 opacity-80 font-normal cursor-pointer">T10</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="fmt-100" checked={formats.hundred} onCheckedChange={() => handleFormatChange('hundred')} />
                                                    <Label htmlFor="fmt-100" className="mx-2 opacity-80 font-normal cursor-pointer">Hundred Balls</Label>
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
                                                value={seriesType}
                                                onValueChange={setSeriesType}
                                                className="flex flex-wrap gap-x-8 gap-y-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="International" id="type-int" />
                                                    <Label htmlFor="type-int" className="mx-2 opacity-80 font-normal cursor-pointer">International</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Domestic" id="type-dom" />
                                                    <Label htmlFor="type-dom" className="mx-2 opacity-80 font-normal cursor-pointer">Domestic</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="League" id="type-league" />
                                                    <Label htmlFor="type-league" className="mx-2 opacity-80 font-normal cursor-pointer">League</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Women" id="type-women" />
                                                    <Label htmlFor="type-women" className="mx-2 opacity-80 font-normal cursor-pointer">Women</Label>
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
                                                value={gender}
                                                onValueChange={setGender}
                                                className="flex flex-wrap gap-x-8 gap-y-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Male" id="gd-male" />
                                                    <Label htmlFor="gd-male" className="mx-2 opacity-80 font-normal cursor-pointer">Male</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Female" id="gd-female" />
                                                    <Label htmlFor="gd-female" className="mx-2 opacity-80 font-normal cursor-pointer">Female</Label>
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
                                                value={activeFormat}
                                                onValueChange={setActiveFormat}
                                                className="flex flex-wrap gap-x-8 gap-y-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="ODI" id="af-odi" />
                                                    <Label htmlFor="af-odi" className="mx-2 opacity-80 font-normal cursor-pointer">ODI</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="T20" id="af-t20" />
                                                    <Label htmlFor="af-t20" className="mx-2 opacity-80 font-normal cursor-pointer">T20</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Test" id="af-test" />
                                                    <Label htmlFor="af-test" className="mx-2 opacity-80 font-normal cursor-pointer">Test</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="T10" id="af-t10" />
                                                    <Label htmlFor="af-t10" className="mx-2 opacity-80 font-normal cursor-pointer">T10</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="100B" id="af-100b" />
                                                    <Label htmlFor="af-100b" className="mx-2 opacity-80 font-normal cursor-pointer">Hundred Balls</Label>
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
                                                value={status}
                                                onValueChange={(value) => setStatus(value as any)}
                                                className="flex flex-wrap gap-x-8 gap-y-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Scheduled" id="st-scheduled" />
                                                    <Label htmlFor="st-scheduled" className="mx-2 opacity-80 font-normal cursor-pointer">Scheduled</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Upcoming" id="st-upcoming" />
                                                    <Label htmlFor="st-upcoming" className="mx-2 opacity-80 font-normal cursor-pointer">Upcoming</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Running" id="st-running" />
                                                    <Label htmlFor="st-running" className="mx-2 opacity-80 font-normal cursor-pointer">Running</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Finished" id="st-finished" />
                                                    <Label htmlFor="st-finished" className="mx-2 opacity-80 font-normal cursor-pointer">Finished</Label>
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
                                                        />
                                                        <Label htmlFor="dont-show" className="mx-2 opacity-80 font-normal cursor-pointer">Don't Show On CE11</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="tours-only"
                                                            checked={configs.toursOnlyTwoTeams}
                                                            onCheckedChange={() => handleConfigChange('toursOnlyTwoTeams')}
                                                        />
                                                        <Label htmlFor="tours-only" className="mx-2 opacity-80 font-normal cursor-pointer">IS TOUR(ONLY TWO TEAMS)</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="featured"
                                                            checked={configs.isFeatured}
                                                            onCheckedChange={() => handleConfigChange('isFeatured')}
                                                        />
                                                        <Label htmlFor="featured" className="mx-2 opacity-80 font-normal cursor-pointer">Is Featured Series</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id="home-page"
                                                            checked={configs.onHome}
                                                            onCheckedChange={() => handleConfigChange('onHome')}
                                                        />
                                                        <Label htmlFor="home-page" className="mx-2 opacity-80 font-normal cursor-pointer">On OneCricket Home</Label>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id="multi-squad"
                                                        checked={configs.allowSquadMultiple}
                                                        onCheckedChange={() => handleConfigChange('allowSquadMultiple')}
                                                    />
                                                    <Label htmlFor="multi-squad" className="mx-2 opacity-80 font-normal cursor-pointer">Allow Squad in Multiple Teams</Label>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Notifications Row */}
                        <div className="w-full">
                            <table className="w-full">
                                <tbody>
                                    <tr className="border-b border-transparent">
                                        <td className="w-48 align-top py-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notifications</Label>
                                        </td>
                                        <td className="align-top py-2">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex flex-wrap gap-6">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox id="odds-notification" checked={oddsNotification} onCheckedChange={setOddsNotification} />
                                                        <Label htmlFor="odds-notification" className="mx-2 opacity-80 font-normal cursor-pointer">Odds Notification</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox id="per-notification" checked={perNotification} onCheckedChange={setPerNotification} />
                                                        <Label htmlFor="per-notification" className="mx-2 opacity-80 font-normal cursor-pointer">Per/Percentage Notification</Label>
                                                    </div>
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
                                            <div className="flex flex-col gap-4">
                                                <div className="flex flex-wrap gap-6">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox id="has-squad" checked={hasSquad} onCheckedChange={setHasSquad} />
                                                        <Label htmlFor="has-squad" className="mx-2 opacity-80 font-normal cursor-pointer">Squad Management (Sq)</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox id="has-fixtures" checked={hasFixtures} onCheckedChange={setHasFixtures} />
                                                        <Label htmlFor="has-fixtures" className="mx-2 opacity-80 font-normal cursor-pointer">Fixtures (Fix)</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox id="has-points" checked={hasPoints} onCheckedChange={setHasPoints} />
                                                        <Label htmlFor="has-points" className="mx-2 opacity-80 font-normal cursor-pointer">Points Table (Pt)</Label>
                                                    </div>
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
                                                            placeholder="Enter Notification ObjectId (24 hex chars)"
                                                            className="font-mono text-xs"
                                                        />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <Label className="text-xs text-slate-400">Broadcaster (MongoDB ID)</Label>
                                                        <Input
                                                            value={broadcaster}
                                                            onChange={(e) => setBroadcaster(e.target.value)}
                                                            placeholder="Enter Broadcaster ObjectId (24 hex chars)"
                                                            className="font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col md:flex-row gap-4">
                                                    <div className="flex-1 space-y-1">
                                                        <Label className="text-xs text-slate-400">Tournament Type</Label>
                                                        <Select value={tournamentType} onValueChange={setTournamentType}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="knockout">Knockout</SelectItem>
                                                                <SelectItem value="league">League</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <Label className="text-xs text-slate-400">Host Team (MongoDB ID)</Label>
                                                        <Input
                                                            value={hostTeam}
                                                            onChange={(e) => setHostTeam(e.target.value)}
                                                            placeholder="Enter Team ObjectId (24 hex chars)"
                                                            className="font-mono text-xs"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex-1 space-y-1 w-full md:w-1/2">
                                                    <Label className="text-xs text-slate-400">DRS System</Label>
                                                    <Input type="number" value={drsSystem} onChange={(e) => setDrsSystem(e.target.value)} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
