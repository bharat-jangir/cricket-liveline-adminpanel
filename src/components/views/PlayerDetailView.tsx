import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { RichTextEditor } from '../ui/RichTextEditor';
import { Save, ArrowLeft, Twitter, Instagram, Loader2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { PlayerService } from '../../services/player.service';
import type { Player, CreatePlayerDto } from '../../types/player';
import { calculateProgressFromFormState } from '../../utils/playerProgress';

export function PlayerDetailView() {
    const { playerId } = useParams();
    const navigate = useNavigate();
    const isNew = !playerId || playerId === 'new';

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [fullName, setFullName] = useState('');
    const [shortName, setShortName] = useState('');
    const [nickName, setNickName] = useState('');
    const [iccName, setIccName] = useState('');

    // Sync firstName + lastName with fullName
    const handleFirstNameChange = (value: string) => {
        setFirstName(value);
        setFullName(`${value} ${lastName}`.trim());
    };

    const handleLastNameChange = (value: string) => {
        setLastName(value);
        setFullName(`${firstName} ${value}`.trim());
    };

    // Status & Gender
    const [isActive, setIsActive] = useState('active');
    const [gender, setGender] = useState('male');

    // Socials
    const [twitter, setTwitter] = useState('');
    const [instagram, setInstagram] = useState('');

    // Team
    const [intlTeam, setIntlTeam] = useState('');

    // Image & Skin Tone
    const [playerImage, setPlayerImage] = useState<string>('');
    const [playerImageFile, setPlayerImageFile] = useState<File | null>(null);
    const [skinTone, setSkinTone] = useState('#f8d9bd');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (file: File | null, preview: string | null) => {
        setPlayerImageFile(file);
        setPlayerImage(preview || '');
    };

    const handleChangePhoto = () => {
        fileInputRef.current?.click();
    };

    const handleRemovePhoto = () => {
        setPlayerImage('');
        setPlayerImageFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Bio
    const [bio, setBio] = useState('');

    // Personal Details
    const [dob, setDob] = useState('');
    const [dod, setDod] = useState('');
    const [nationality, setNationality] = useState('');
    const [birthPlace, setBirthPlace] = useState('');
    const [playerFor, setPlayerFor] = useState('');
    const [height, setHeight] = useState('');

    // Cricketing Details
    const [battingStyle, setBattingStyle] = useState('right');
    const [isMiddleOrder, setIsMiddleOrder] = useState(false);
    const [isWicketKeeper, setIsWicketKeeper] = useState('no');

    const [bowlingStyle, setBowlingStyle] = useState('none');
    const [bowlingArm, setBowlingArm] = useState('right');

    const [role, setRole] = useState('batsman');
    const [jerseyNumber, setJerseyNumber] = useState<number | undefined>(undefined);

    // Extras
    const [behaviour, setBehaviour] = useState('');
    const [signatureShot, setSignatureShot] = useState('');
    const [website, setWebsite] = useState('');
    const [fantasyCredits, setFantasyCredits] = useState('');

    const [activeTab, setActiveTab] = useState("basic");
    const [loadedPlayer, setLoadedPlayer] = useState<Player | null>(null);

    // Calculate profile completion percentage from form state
    // This updates in real-time as user edits
    // The calculation excludes default values to match API data structure
    const profileProgress = calculateProgressFromFormState({
        fullName,
        shortName,
        nickName,
        iccName,
        nationality,
        role,
        dob,
        birthPlace,
        height,
        jerseyNumber,
        battingStyle,
        bowlingStyle,
        bowlingArm,
        isMiddleOrder,
        bio,
        behaviour,
        signatureShot,
        website,
        fantasyCredits,
        twitter,
        instagram,
        playerImage,
        gender,
        intlTeam,
        playerFor,
        skinTone,
    });

    // Load player data if editing
    useEffect(() => {
        if (!isNew && playerId) {
            loadPlayer(playerId);
        }
    }, [playerId, isNew]);

    const loadPlayer = async (id: string) => {
        setLoading(true);
        try {
            const response = await PlayerService.getPlayer(id);
            if (response.data?.result) {
                const player = response.data.result;
                setLoadedPlayer(player); // Store the loaded player for progress calculation
                
                // Map API data to form fields
                // Only set values that exist, to match API data structure
                setFullName(player.name || '');
                const nameParts = (player.name || '').split(' ');
                setFirstName(nameParts[0] || '');
                setLastName(nameParts.slice(1).join(' ') || '');
                setShortName(player.shortName ?? player.fullName ?? '');
                setNickName(player.nickName ?? '');
                setIccName(player.iccName ?? '');
                setNationality(player.nationality ?? player.country ?? '');
                setBirthPlace(player.birthPlace ?? '');
                setHeight(player.height ?? '');
                setDob(player.dob ? new Date(player.dob).toISOString().split('T')[0] : '');
                setDod(player.dod ? new Date(player.dod).toISOString().split('T')[0] : '');
                setPlayerFor(player.playerFor ?? '');
                
                // Status & Gender
                setIsActive(player.isActive ? 'active' : 'inactive');
                setGender(player.gender ?? 'male');
                setIntlTeam(player.intlTeam ?? '');
                
                // Cricketing details
                setRole(player.role || 'batsman');
                setBattingStyle(player.battingStyle === 'left-hand' ? 'left' : 'right');
                setBowlingStyle(player.bowlingStyle ?? 'none');
                setBowlingArm(player.bowlingArm ?? 'right');
                setIsMiddleOrder(player.isMiddleOrder ?? false);
                setIsWicketKeeper(player.role === 'wicket-keeper' ? 'yes' : 'no');
                setJerseyNumber(player.jerseyNumber);
                
                // Social media
                setTwitter(player.socialMedia?.twitter ?? '');
                setInstagram(player.socialMedia?.instagram ?? '');
                
                // Bio & Extras
                setBio(player.bio ?? '');
                setBehaviour(player.behaviour ?? '');
                setSignatureShot(player.signatureShot ?? '');
                setWebsite(player.website ?? '');
                setFantasyCredits(player.fantasyCredits !== undefined ? player.fantasyCredits.toString() : '');
                
                // Image & Skin Tone
                setPlayerImage(player.image ?? '');
                setSkinTone(player.skinTone ?? '#f8d9bd');
            }
        } catch (error: any) {
            console.error('Failed to load player:', error);
            toast.error(error.response?.data?.userMessage || 'Failed to load player');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Validate required fields
        if (!fullName || !fullName.trim()) {
            toast.error('Please enter player name');
            return;
        }
        
        if (!nationality || !nationality.trim()) {
            toast.error('Please enter country/nationality');
            return;
        }

        setSaving(true);
        try {
            // Map form fields to API format
            const playerData: CreatePlayerDto = {
                name: fullName.trim(),
                fullName: shortName ? shortName.trim() : fullName.trim(),
                shortName: shortName ? shortName.trim() : undefined,
                nickName: nickName || undefined,
                iccName: iccName || undefined,
                slug: PlayerService.generateSlug(fullName),
                country: nationality.trim(),
                nationality: nationality.trim(),
                gender: gender as any,
                intlTeam: intlTeam || undefined,
                playerFor: playerFor || undefined,
                role: role as any,
                battingStyle: battingStyle === 'right' ? 'right-hand' : 'left-hand',
                bowlingStyle: bowlingStyle && bowlingStyle !== 'none' ? bowlingStyle : undefined,
                bowlingArm: bowlingArm as any,
                isMiddleOrder: isMiddleOrder,
                jerseyNumber: jerseyNumber,
                height: height || undefined,
                birthPlace: birthPlace || undefined,
                skinTone: skinTone !== '#f8d9bd' ? skinTone : undefined,
                dob: dob ? new Date(dob) : undefined,
                dod: dod ? new Date(dod) : undefined,
                bio: bio || undefined,
                behaviour: behaviour || undefined,
                signatureShot: signatureShot || undefined,
                website: website || undefined,
                fantasyCredits: fantasyCredits ? parseFloat(fantasyCredits) : undefined,
                isActive: isActive === 'active',
                isRetired: false,
                image: playerImage || undefined,
                socialMedia: (twitter || instagram) ? {
                    twitter: twitter || undefined,
                    instagram: instagram || undefined,
                } : undefined,
            };

            console.log('Saving player data:', playerData);

            if (isNew) {
                const response = await PlayerService.createPlayer(playerData);
                toast.success('Player created successfully');
                navigate(`/players/${response.data.result._id}`);
            } else if (playerId) {
                await PlayerService.updatePlayer(playerId, playerData);
                toast.success('Player updated successfully');
            }
        } catch (error: any) {
            console.error('Failed to save player:', error);
            const errorMsg = error.response?.data?.developerMessage || error.response?.data?.userMessage || error.message || 'Failed to save player';
            toast.error(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="size-5 animate-spin" />
                    <span>Loading player...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 px-6 bg-slate-50 dark:bg-slate-900">
            {/* Top Header Area */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/players')}>
                            <ArrowLeft className="size-5" />
                        </Button>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {isNew ? 'New Player' : fullName}
                        </h1>
                    </div>

                    <div className="flex items-center gap-6">
                        {!isNew && (
                            <Badge variant="secondary" className="bg-slate-200 text-slate-700 hover:bg-slate-300">
                                Firebase Data: {fullName}
                            </Badge>
                        )}

                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button className="px-3 py-1 text-sm font-medium rounded-md bg-white dark:bg-slate-700 shadow-sm">English</button>
                            <button className="px-3 py-1 text-sm font-medium rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400">Hindi</button>
                        </div>

                        <div className="flex flex-col gap-1 w-32">
                            <div className="h-2 w-full bg-green-100 dark:bg-green-900/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                                    style={{ width: `${profileProgress}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium text-right">{profileProgress}% COMPLETE</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4 ml-2">
                        <Button variant="outline" onClick={() => navigate('/players')} disabled={saving}>Cancel</Button>
                        <Button 
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                            Save
                        </Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-transparent w-full justify-start gap-2 h-auto p-0">
                        <TabsTrigger
                            value="basic"
                            className={`rounded-md px-4 py-2 transition-colors ${activeTab === 'basic' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}
                        >
                            Basic Details
                        </TabsTrigger>
                        <TabsTrigger
                            value="career"
                            className={`rounded-md px-4 py-2 transition-colors ${activeTab === 'career' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}
                        >
                            Career Stats
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="pt-6 space-y-8 animate-in fade-in slide-in-from-top-2 bg-slate-50 dark:bg-slate-900">

                        {/* Basic Info Section */}
                        <div className="flex flex-col lg:flex-row gap-8 bg-slate-50 dark:bg-slate-900">

                            {/* Left Column: Image & Skin Tone */}
                            <div className="w-full lg:w-1/4 space-y-6">
                                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                    <CardContent className="pt-6 flex flex-col items-center gap-4">
                                        <div className="w-40 h-40 relative rounded-full overflow-hidden border-4 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                            {playerImage ? (
                                                <img
                                                    src={playerImage}
                                                    alt="Player"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-600">
                                                    <span className="text-slate-400 dark:text-slate-500 text-sm">No Image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 w-full px-2">
                                            <Button 
                                                variant="outline" 
                                                className="flex-1 text-xs border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700" 
                                                size="sm"
                                                onClick={handleChangePhoto}
                                                type="button"
                                            >
                                                Change Photo
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="flex-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-700" 
                                                size="sm"
                                                onClick={handleRemovePhoto}
                                                type="button"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        handleImageChange(file, reader.result as string);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="hidden"
                                        />

                                        <div className="w-full space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">Skin Tone</Label>
                                            <div className="flex items-center gap-3 px-2">
                                                <input
                                                    type="color"
                                                    value={skinTone}
                                                    onChange={(e) => setSkinTone(e.target.value)}
                                                    className="w-12 h-12 rounded-md cursor-pointer border-2 border-slate-300 dark:border-slate-600 p-0"
                                                />
                                                <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">{skinTone}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column: Basic Fields Card */}
                            <div className="w-full lg:w-3/4">
                                <Card>
                                    <CardContent className="pt-6 space-y-6">
                                        {/* Name Row 1 */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">First Name *</Label>
                                                <Input value={firstName} onChange={(e) => handleFirstNameChange(e.target.value)} placeholder="Enter First Name" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">Last Name *</Label>
                                                <Input value={lastName} onChange={(e) => handleLastNameChange(e.target.value)} placeholder="Enter Last Name" />
                                            </div>
                                        </div>

                                        {/* Name Row 2 */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">Full Name *</Label>
                                                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter Full Name" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">Short Name *</Label>
                                                <Input value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="Enter Short Name" />
                                            </div>
                                        </div>

                                        {/* Name Row 3 */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">Nick Name</Label>
                                                <Input value={nickName} onChange={(e) => setNickName(e.target.value)} placeholder="Enter Nick Name" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">ICC Name</Label>
                                                <Input value={iccName} onChange={(e) => setIccName(e.target.value)} placeholder="Enter ICC Name" />
                                            </div>
                                        </div>

                                        {/* Status & Gender */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">Status</Label>
                                                <RadioGroup value={isActive} onValueChange={setIsActive} className="flex gap-4">
                                                    <div className="flex items-center">
                                                        <RadioGroupItem value="active" id="st-active" />
                                                        <Label htmlFor="st-active" className="font-normal cursor-pointer mx-2">Active</Label>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <RadioGroupItem value="inactive" id="st-inactive" />
                                                        <Label htmlFor="st-inactive" className="font-normal cursor-pointer mx-2">Inactive</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold text-slate-500 uppercase">Gender</Label>
                                                <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4">
                                                    <div className="flex items-center">
                                                        <RadioGroupItem value="male" id="gd-male" />
                                                        <Label htmlFor="gd-male" className="font-normal cursor-pointer mx-2">Male</Label>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <RadioGroupItem value="female" id="gd-female" />
                                                        <Label htmlFor="gd-female" className="font-normal cursor-pointer mx-2">Female</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                        </div>

                                        {/* Social Media */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                                    <Twitter className="size-3 text-blue-400" />
                                                    Twitter Handle
                                                </Label>
                                                <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@username" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                                    <Instagram className="size-3 text-pink-500" />
                                                    Instagram Handle
                                                </Label>
                                                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@username" />
                                            </div>
                                        </div>

                                        {/* International Team */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">International Team *</Label>
                                            <Select value={intlTeam} onValueChange={setIntlTeam}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Team" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ind">India</SelectItem>
                                                    <SelectItem value="aus">Australia</SelectItem>
                                                    <SelectItem value="eng">England</SelectItem>
                                                    <SelectItem value="pak">Pakistan</SelectItem>
                                                    <SelectItem value="sa">South Africa</SelectItem>
                                                    <SelectItem value="nz">New Zealand</SelectItem>
                                                    <SelectItem value="wi">West Indies</SelectItem>
                                                    <SelectItem value="sl">Sri Lanka</SelectItem>
                                                    <SelectItem value="ban">Bangladesh</SelectItem>
                                                    <SelectItem value="afg">Afghanistan</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Bio Section */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Player Bio</h3>
                            <Card>
                                <CardContent className="pt-6">
                                    <RichTextEditor
                                        value={bio}
                                        onChange={setBio}
                                        placeholder="Write player biography..."
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Personal Details Grid */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Personal Details</h3>
                            <Card>
                                <CardContent className="pt-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Date of Birth *</Label>
                                            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Date of Death</Label>
                                            <Input type="date" value={dod} onChange={(e) => setDod(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Nationality *</Label>
                                            <Input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="e.g., Indian" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Place of Birth</Label>
                                            <Input value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} placeholder="e.g., Delhi, India" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Playing For</Label>
                                            <Input value={playerFor} onChange={(e) => setPlayerFor(e.target.value)} placeholder="Country/Team" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Height</Label>
                                            <Input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g., 5'9&quot;, 175cm" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Jersey Number</Label>
                                            <Input 
                                                type="number" 
                                                min="1" 
                                                max="99" 
                                                value={jerseyNumber || ''} 
                                                onChange={(e) => setJerseyNumber(e.target.value ? parseInt(e.target.value) : undefined)} 
                                                placeholder="e.g., 18" 
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Cricketing Details Grid */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Cricketing Details</h3>
                            <Card>
                                <CardContent className="pt-6 space-y-6">
                                    {/* Batting */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Batting Style</Label>
                                            <RadioGroup value={battingStyle} onValueChange={setBattingStyle} className="flex gap-4">
                                                <div className="flex items-center">
                                                    <RadioGroupItem value="right" id="bat-right" />
                                                    <Label htmlFor="bat-right" className="mx-2">Right Hand</Label>
                                                </div>
                                                <div className="flex items-center">
                                                    <RadioGroupItem value="left" id="bat-left" />
                                                    <Label htmlFor="bat-left" className="mx-2">Left Hand</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center mt-4">
                                            <Checkbox id="middle-order" checked={isMiddleOrder} onCheckedChange={(c) => setIsMiddleOrder(!!c)} />
                                            <Label htmlFor="middle-order" className="mx-2">Middle Order Batsman</Label>
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <Label className="text-xs font-bold text-slate-500 uppercase block">Wicket Keeper</Label>
                                            <RadioGroup value={isWicketKeeper} onValueChange={setIsWicketKeeper} className="flex gap-4">
                                                <div className="flex items-center">
                                                    <RadioGroupItem value="yes" id="wk-yes" />
                                                    <Label htmlFor="wk-yes" className="mx-2">Yes</Label>
                                                </div>
                                                <div className="flex items-center">
                                                    <RadioGroupItem value="no" id="wk-no" />
                                                    <Label htmlFor="wk-no" className="mx-2">No</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    </div>

                                    {/* Bowling */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Bowling Style</Label>
                                            <Select value={bowlingStyle} onValueChange={setBowlingStyle}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Style" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    <SelectItem value="fast">Fast</SelectItem>
                                                    <SelectItem value="medium">Medium Fast</SelectItem>
                                                    <SelectItem value="spin">Spin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Bowling Arm</Label>
                                            <RadioGroup value={bowlingArm} onValueChange={setBowlingArm} className="flex gap-4">
                                                <div className="flex items-center">
                                                    <RadioGroupItem value="right" id="bowl-right" />
                                                    <Label htmlFor="bowl-right" className="mx-2">Right Arm</Label>
                                                </div>
                                                <div className="flex items-center">
                                                    <RadioGroupItem value="left" id="bowl-left" />
                                                    <Label htmlFor="bowl-left" className="mx-2">Left Arm</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <div className="w-full md:w-1/2 space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Playing Role</Label>
                                            <Select value={role} onValueChange={setRole}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="batsman">Batsman</SelectItem>
                                                    <SelectItem value="bowler">Bowler</SelectItem>
                                                    <SelectItem value="all-rounder">All Rounder</SelectItem>
                                                    <SelectItem value="wicket-keeper">Wicket Keeper</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                        </div>

                        {/* Extras Grid */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Extras</h3>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Behaviour</Label>
                                            <Input value={behaviour} onChange={e => setBehaviour(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Signature Shot</Label>
                                            <Input value={signatureShot} onChange={e => setSignatureShot(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Website</Label>
                                            <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase">Fantasy Credits</Label>
                                            <Input type="number" value={fantasyCredits} onChange={e => setFantasyCredits(e.target.value)} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                    </TabsContent>

                    <TabsContent value="career" className="pt-6 space-y-8 animate-in fade-in slide-in-from-top-2">
                        {/* Batting Stats */}
                        <div className="overflow-hidden bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            {/* Left Sidebar */}
                            <div className="flex">
                                <div className="w-24 bg-slate-900 flex flex-col shrink-0 text-white">
                                    <div className="h-16 flex items-center justify-center font-bold border-b border-slate-700">
                                        Batting
                                    </div>
                                    <div className="flex-1 bg-slate-800"></div>
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 p-6 overflow-x-auto">
                                    <div className="min-w-max">
                                        <table className="w-full border-separate border-spacing-y-4">
                                            <thead className="bg-slate-200 dark:bg-slate-700">
                                                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center dark:text-slate-50">
                                                    <th className="px-2">CB</th>
                                                    <th className="px-2">M</th>
                                                    <th className="px-2">Inn</th>
                                                    <th className="px-2">NO</th>
                                                    <th className="px-2">RUNS</th>
                                                    <th className="px-2">HS</th>
                                                    <th className="px-2">AVG</th>
                                                    <th className="px-2">BF</th>
                                                    <th className="px-2">SR</th>
                                                    <th className="px-2">100s</th>
                                                    <th className="px-2">200s</th>
                                                    <th className="px-2">50s</th>
                                                    <th className="px-2">4s</th>
                                                    <th className="px-2">6s</th>
                                                    <th className="px-2">CT</th>
                                                    <th className="px-2">ST</th>
                                                    <th className="px-2">DEBUT</th>
                                                    <th className="px-2">DEBUT MATCH</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="px-2"><Button variant="outline" size="sm" className="w-16 rounded-full text-[5px] h-8">copy</Button></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0.0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0.0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-20 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="-" /></td>
                                                    <td className="px-2"><Input className="w-24 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="-" /></td>
                                                    <td>
                                                        <div className="flex justify-end ">
                                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-10 w-32">
                                                                UPDATE
                                                            </Button>
                                                        </div></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bowling Stats */}
                        <div className="overflow-hidden bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            <div className="flex">
                                {/* Left Sidebar */}
                                <div className="w-24 bg-slate-900 flex flex-col shrink-0 text-white">
                                    <div className="h-16 flex items-center justify-center font-bold border-b border-slate-700">
                                        Bowling
                                    </div>
                                    <div className="flex-1 bg-slate-800"></div>
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 p-6 overflow-x-auto">
                                    <div className="min-w-max">
                                        <table className="w-full border-separate border-spacing-y-4">
                                            <thead className="bg-slate-200 dark:bg-slate-700">
                                                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center dark:text-slate-50">
                                                    <th className="px-2">CB</th>
                                                    <th className="px-2">M</th>
                                                    <th className="px-2">Inn</th>
                                                    <th className="px-2">BALLS</th>
                                                    <th className="px-2">RUNS</th>
                                                    <th className="px-2">WICKET</th>
                                                    <th className="px-2">BBI</th>
                                                    <th className="px-2">BBM</th>
                                                    <th className="px-2">ECON</th>
                                                    <th className="px-2">AVG</th>
                                                    <th className="px-2">SR</th>
                                                    <th className="px-2">5W</th>
                                                    <th className="px-2">10W</th>
                                                    <th className="px-2">2W</th>
                                                    <th className="px-2">MAIDENS</th>
                                                    <th className="px-2">BOWLDEBUT</th>
                                                    <th className="px-2">BOWLDEBUT MATCH</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="px-2"><Button variant="outline" size="sm" className="w-16 rounded-full text-[5px] h-8">copy</Button></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0.0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0.0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0.0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-16 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="0" /></td>
                                                    <td className="px-2"><Input className="w-20 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="-" /></td>
                                                    <td className="px-2"><Input className="w-24 rounded-full text-center h-8 text-xs bg-slate-50 dark:bg-slate-900" placeholder="-" /></td>
                                                    <td>
                                                        <div className="flex justify-end ">
                                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-10 w-32">
                                                                UPDATE
                                                            </Button>
                                                        </div></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
