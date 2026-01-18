"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ImageUpload } from "../ui/ImageUpload";
import { RichTextEditor } from "../ui/RichTextEditor";
import { Team, Formats, Captains } from "../../types/team";
import { TeamService } from "../../services/team.service";
import { toast } from "sonner";

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
];

export function TeamFormView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [saving, setSaving] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [activeLanguageTab, setActiveLanguageTab] = useState('en');
  const [jerseyTab, setJerseyTab] = useState<'limited' | 'test'>('limited');

  const [flagPreview, setFlagPreview] = useState<string | null>(null);
  const [jerseyLimitedPreview, setJerseyLimitedPreview] = useState<string | null>(null);
  const [jerseyTestPreview, setJerseyTestPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Team>>({
    name: '',
    shortName: '',
    code: '',
    type: 'international',
    format: 'men',
    country: '',
    fantasyName: '',
    fantasyShortName: '',
    colorCode: '#1E40AF',
    upColor: '#3B82F6',
    brightTheme: false,
    translations: {},
    isActive: true,
  });

  // Additional form state for new fields
  const [bio, setBio] = useState('');
  const [formats, setFormats] = useState<Formats>({
    t20: false,
    odi: false,
    test: false,
    t10: false,
    hundred: false,
  });
  const [teamType, setTeamType] = useState<'international' | 'domestic' | 'league'>('international');
  const [gender, setGender] = useState<'men' | 'women'>('men');
  const [seriesType, setSeriesType] = useState('');
  const [captains, setCaptains] = useState<Captains>({
    odi: '',
    t20: '',
    t10: '',
    test: '',
    hundred: '',
  });
  const [owner, setOwner] = useState('');
  const [board, setBoard] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [activeFrom, setActiveFrom] = useState('');
  const [activeTo, setActiveTo] = useState('');
  const [tournamentsWon, setTournamentsWon] = useState('');
  const [tournamentsCaptains, setTournamentsCaptains] = useState('');

  const [languageData, setLanguageData] = useState<{
    [key: string]: { name: string; fantasyName: string };
  }>({
    en: { name: '', fantasyName: '' },
    hi: { name: '', fantasyName: '' },
    ta: { name: '', fantasyName: '' },
    te: { name: '', fantasyName: '' },
  });

  // Load team data if editing
  useEffect(() => {
    if (isEdit && id) {
      loadTeam();
    }
  }, [id, isEdit]);

  const loadTeam = async () => {
    try {
      const response = await TeamService.getTeam(id!);

      if (response.status) {
        const team = response.data.result;
        setFormData(team);
        setBio(team.bio || '');
        setFormats(team.formats || {
          t20: false,
          odi: false,
          test: false,
          t10: false,
          hundred: false,
        });
        setTeamType(team.teamType || 'international');
        setGender(team.gender || 'men');
        setSeriesType(team.seriesType || '');
        setCaptains(team.captains || {
          odi: '',
          t20: '',
          t10: '',
          test: '',
          hundred: '',
        });
        setOwner(team.owner || '');
        setBoard(team.board || '');
        setSelectedCountry(team.country || '');
        setActiveFrom(team.activeFrom ? new Date(team.activeFrom).toISOString().split('T')[0] : '');
        setActiveTo(team.activeTo ? new Date(team.activeTo).toISOString().split('T')[0] : '');
        setTournamentsWon(team.tournamentsWon || '');
        setTournamentsCaptains(team.tournamentsCaptains || '');

        // Handle translations - merge with existing languageData structure
        const translations = team.translations || {};
        setLanguageData({
          en: {
            name: translations.en?.name || team.name || '',
            fantasyName: translations.en?.fantasyName || team.fantasyName || '',
          },
          hi: {
            name: translations.hi?.name || '',
            fantasyName: translations.hi?.fantasyName || '',
          },
          ta: {
            name: translations.ta?.name || '',
            fantasyName: translations.ta?.fantasyName || '',
          },
          te: {
            name: translations.te?.name || '',
            fantasyName: translations.te?.fantasyName || '',
          },
        });

        if (team.logo) setFlagPreview(team.logo);
        if (team.jerseyLimited) setJerseyLimitedPreview(team.jerseyLimited);
        if (team.jerseyTest) setJerseyTestPreview(team.jerseyTest);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.userMessage || 'Failed to load team');
      navigate('/teams');
    } finally {
      // Done loading
    }
  };

  const handleLanguageDataChange = (field: 'name' | 'fantasyName', value: string) => {
    setLanguageData({
      ...languageData,
      [activeLanguageTab]: {
        ...languageData[activeLanguageTab],
        [field]: value,
      },
    });

    // If editing English (en), also update main formData for backward compatibility
    if (activeLanguageTab === 'en') {
      if (field === 'name') {
        setFormData({ ...formData, name: value });
      } else if (field === 'fantasyName') {
        setFormData({ ...formData, fantasyName: value });
      }
    }
  };

  // Clean form data utility to remove unwanted fields
  const cleanFormData = (data: any): any => {
    const cleanedData = { ...data };

    // Remove MongoDB specific fields
    delete cleanedData._id;
    delete cleanedData.__v;
    delete cleanedData.createdAt;
    delete cleanedData.updatedAt;

    // Recursively clean nested objects and convert empty strings to undefined
    Object.keys(cleanedData).forEach(key => {
      // Convert empty strings to undefined
      if (cleanedData[key] === '') {
        cleanedData[key] = undefined;
      }

      // Clean nested objects
      if (cleanedData[key] && typeof cleanedData[key] === 'object' && !Array.isArray(cleanedData[key])) {
        if (cleanedData[key]._id) delete cleanedData[key]._id;
        if (cleanedData[key].__v) delete cleanedData[key].__v;
        if (cleanedData[key].createdAt) delete cleanedData[key].createdAt;
        if (cleanedData[key].updatedAt) delete cleanedData[key].updatedAt;

        // Clean empty strings in nested objects (like captains)
        Object.keys(cleanedData[key]).forEach(nestedKey => {
          if (cleanedData[key][nestedKey] === '') {
            cleanedData[key][nestedKey] = undefined;
          }
        });
      }
    });

    return cleanedData;
  };

  const handleSave = async () => {
    // Validation
    if (!languageData.en?.name || !formData.shortName || !formData.code || !formData.country) {
      toast.error('Please fill all required fields (at least English name, short name, code, and country)');
      return;
    }

    // Ensure main formData has the English name for backward compatibility
    if (!formData.name) {
      formData.name = languageData.en.name;
    }
    if (!formData.fantasyName && languageData.en.fantasyName) {
      formData.fantasyName = languageData.en.fantasyName;
    }

    // Prepare team data with translations
    const teamData: Partial<Team> = {
      ...formData,
      logo: flagPreview || undefined,
      jerseyLimited: jerseyLimitedPreview || undefined,
      jerseyTest: jerseyTestPreview || undefined,
      translations: languageData, // Include language translations
      bio,
      formats,
      teamType,
      gender,
      seriesType: seriesType || undefined,
      captains,
      owner: owner || undefined,
      board: board || undefined,
      activeFrom: activeFrom ? new Date(activeFrom) : undefined,
      activeTo: activeTo ? new Date(activeTo) : undefined,
      tournamentsWon: tournamentsWon || undefined,
      tournamentsCaptains: tournamentsCaptains || undefined,
    };

    // Clean the data but preserve translations
    const cleanedData = cleanFormData(teamData);

    // Ensure translations are included (cleanFormData might affect it)
    if (languageData) {
      cleanedData.translations = languageData;
    }

    console.log('Saving team data with translations:', cleanedData);

    try {
      setSaving(true);

      if (isEdit) {
        const response = await TeamService.updateTeam(id!, cleanedData);
        if (response.status) {
          toast.success('Team updated successfully');
          navigate('/teams');
        }
      } else {
        const response = await TeamService.createTeam(cleanedData);
        if (response.status) {
          toast.success('Team created successfully');
          navigate('/teams');
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.userMessage || 'Failed to save team';
      toast.error(errorMessage);
      console.error('Save error:', error.response?.data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate("/teams")}>
            Teams
          </span>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">
            {isEdit ? "Edit Team" : "Add Team"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/teams")}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isEdit ? "Edit Team" : "Add New Team"}
            </h1>
          </div>

          <div className="flex gap-2">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Tabs value={activeLanguageTab} onValueChange={setActiveLanguageTab}>
            <TabsList className="bg-slate-100 dark:bg-slate-800 p-1">
              {LANGUAGES.map((lang) => (
                <TabsTrigger key={lang.code} value={lang.code}>
                  {lang.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/teams")} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white gap-2" disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : (isEdit ? "Update Team" : "Save Team")}
            </Button>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Team Details */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-6 space-y-8">

                {/* Flag Preview and Firebase Data */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Team Flag & Identity</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Flag Preview */}
                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Team Flag / Logo</Label>
                      <div className="mt-2">
                        <ImageUpload
                          value={flagPreview || undefined}
                          onChange={(_file, preview) => setFlagPreview(preview)}
                          label=""
                        />
                      </div>
                    </div>

                    {/* Firebase Data Display */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-500 text-xs">Firebase Key</Label>
                        <div className="mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-600 dark:text-slate-400">
                          {id || 'auto-generated'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-500 text-xs">Team Name</Label>
                        <div className="mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white">
                          {formData.name || 'Not set'}
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-500 text-xs">Short Name</Label>
                        <div className="mt-1 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-900 dark:text-white">
                          {formData.shortName || 'Not set'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                {/* Team Information - Language Specific */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Team Information ({LANGUAGES.find(l => l.code === activeLanguageTab)?.name})
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label className="text-slate-900 dark:text-slate-300">Team Name *</Label>
                      <Input
                        value={languageData[activeLanguageTab]?.name || ''}
                        onChange={(e) => handleLanguageDataChange('name', e.target.value)}
                        className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                        placeholder="Enter team name"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-slate-900 dark:text-slate-300">Team Fantasy Name</Label>
                      <Input
                        value={languageData[activeLanguageTab]?.fantasyName || ''}
                        onChange={(e) => handleLanguageDataChange('fantasyName', e.target.value)}
                        className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                        placeholder="Enter fantasy team name"
                      />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                {/* Team Details - Common Fields */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Team Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Short Name *</Label>
                      <Input
                        value={formData.shortName}
                        onChange={(e) => setFormData({ ...formData, shortName: e.target.value.toUpperCase() })}
                        className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                        placeholder="e.g., IND"
                        maxLength={5}
                      />
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Fantasy Short Name</Label>
                      <Input
                        value={formData.fantasyShortName}
                        onChange={(e) => setFormData({ ...formData, fantasyShortName: e.target.value.toUpperCase() })}
                        className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                        placeholder="e.g., IND"
                        maxLength={5}
                      />
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Team Code *</Label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                        placeholder="Unique code"
                      />
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Country *</Label>
                      <Input
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                        placeholder="Country name"
                      />
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(v: any) => setFormData({ ...formData, type: v })}
                      >
                        <SelectTrigger className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="international">International</SelectItem>
                          <SelectItem value="franchise">Franchise</SelectItem>
                          <SelectItem value="domestic">Domestic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Format</Label>
                      <Select
                        value={formData.format}
                        onValueChange={(v: any) => setFormData({ ...formData, format: v })}
                      >
                        <SelectTrigger className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="men">Men's</SelectItem>
                          <SelectItem value="women">Women's</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                {/* Colors Section */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Team Colors</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Color Code</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={formData.colorCode}
                          onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.colorCode}
                          onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                          className="flex-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-mono"
                          placeholder="#1E40AF"
                        />
                      </div>
                      {/* Color Preview */}
                      <div className="mt-2 p-4 rounded border border-slate-600" style={{ backgroundColor: formData.colorCode }}>
                        <span className="text-white text-sm font-medium drop-shadow">Color Preview</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Up Color (Secondary)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="color"
                          value={formData.upColor}
                          onChange={(e) => setFormData({ ...formData, upColor: e.target.value })}
                          className="w-16 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={formData.upColor}
                          onChange={(e) => setFormData({ ...formData, upColor: e.target.value })}
                          className="flex-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-mono"
                          placeholder="#3B82F6"
                        />
                      </div>
                      {/* Color Preview */}
                      <div className="mt-2 p-4 rounded border border-slate-600" style={{ backgroundColor: formData.upColor }}>
                        <span className="text-white text-sm font-medium drop-shadow">Color Preview</span>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.brightTheme}
                          onChange={(e) => setFormData({ ...formData, brightTheme: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-600"
                        />
                        <span className="text-sm text-slate-300">Bright Theme</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                {/* Bio Section */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Team Bio</h3>
                  <RichTextEditor
                    value={bio}
                    onChange={setBio}
                    placeholder="Enter team biography..."
                    className="min-h-[200px]"
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                {/* Format Checkboxes */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Formats</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formats.t20}
                        onChange={(e) => setFormats({ ...formats, t20: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-600"
                      />
                      <span className="text-sm text-slate-300">T20</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formats.odi}
                        onChange={(e) => setFormats({ ...formats, odi: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-600"
                      />
                      <span className="text-sm text-slate-300">ODI</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formats.test}
                        onChange={(e) => setFormats({ ...formats, test: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-600"
                      />
                      <span className="text-sm text-slate-300">Test</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formats.t10}
                        onChange={(e) => setFormats({ ...formats, t10: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-600"
                      />
                      <span className="text-sm text-slate-300">T10</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formats.hundred}
                        onChange={(e) => setFormats({ ...formats, hundred: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-600"
                      />
                      <span className="text-sm text-slate-300">Hundred Balls</span>
                    </label>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                {/* Type Radio Buttons */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Team Type</h3>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="teamType"
                        value="international"
                        checked={teamType === 'international'}
                        onChange={(e) => setTeamType(e.target.value as 'international' | 'domestic' | 'league')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-300">International</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="teamType"
                        value="domestic"
                        checked={teamType === 'domestic'}
                        onChange={(e) => setTeamType(e.target.value as 'international' | 'domestic' | 'league')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-300">Domestic</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="teamType"
                        value="league"
                        checked={teamType === 'league'}
                        onChange={(e) => setTeamType(e.target.value as 'international' | 'domestic' | 'league')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-300">League</span>
                    </label>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                {/* Gender Radio Buttons */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Gender</h3>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="men"
                        checked={gender === 'men'}
                        onChange={(e) => setGender(e.target.value as 'men' | 'women')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-300">Men's</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="women"
                        checked={gender === 'women'}
                        onChange={(e) => setGender(e.target.value as 'men' | 'women')}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-slate-300">Women's</span>
                    </label>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                {/* Series Type and Additional Info */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Additional Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label className="text-slate-900 dark:text-slate-300">Series Type</Label>
                      <Select value={seriesType} onValueChange={setSeriesType}>
                        <SelectTrigger className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                          <SelectValue placeholder="Select series type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bilateral">Bilateral</SelectItem>
                          <SelectItem value="tournament">Tournament</SelectItem>
                          <SelectItem value="league">League</SelectItem>
                          <SelectItem value="world-cup">World Cup</SelectItem>
                          <SelectItem value="champions-trophy">Champions Trophy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Owner</Label>
                      <Input
                        value={owner}
                        onChange={(e) => setOwner(e.target.value)}
                        className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                        placeholder="Team owner"
                      />
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Board</Label>
                      <Input
                        value={board}
                        onChange={(e) => setBoard(e.target.value)}
                        className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                        placeholder="Governing board"
                      />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                {/* Captains Section */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Captains</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">ODI Captain</Label>
                      <Select value={captains.odi} onValueChange={(v) => setCaptains({ ...captains, odi: v })}>
                        <SelectTrigger className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                          <SelectValue placeholder="Select ODI captain" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="player1">Player 1</SelectItem>
                          <SelectItem value="player2">Player 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">T20 Captain</Label>
                      <Select value={captains.t20} onValueChange={(v) => setCaptains({ ...captains, t20: v })}>
                        <SelectTrigger className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                          <SelectValue placeholder="Select T20 captain" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="player1">Player 1</SelectItem>
                          <SelectItem value="player2">Player 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">T10 Captain</Label>
                      <Select value={captains.t10} onValueChange={(v) => setCaptains({ ...captains, t10: v })}>
                        <SelectTrigger className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                          <SelectValue placeholder="Select T10 captain" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="player1">Player 1</SelectItem>
                          <SelectItem value="player2">Player 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Test Captain</Label>
                      <Select value={captains.test} onValueChange={(v) => setCaptains({ ...captains, test: v })}>
                        <SelectTrigger className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                          <SelectValue placeholder="Select Test captain" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="player1">Player 1</SelectItem>
                          <SelectItem value="player2">Player 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Hundred Ball Captain</Label>
                      <Select value={captains.hundred} onValueChange={(v) => setCaptains({ ...captains, hundred: v })}>
                        <SelectTrigger className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                          <SelectValue placeholder="Select Hundred Ball captain" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="player1">Player 1</SelectItem>
                          <SelectItem value="player2">Player 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                {/* Country and Active Period */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Team Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label className="text-slate-900 dark:text-slate-300">Country</Label>
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="india">India</SelectItem>
                          <SelectItem value="australia">Australia</SelectItem>
                          <SelectItem value="england">England</SelectItem>
                          <SelectItem value="pakistan">Pakistan</SelectItem>
                          <SelectItem value="south-africa">South Africa</SelectItem>
                          <SelectItem value="new-zealand">New Zealand</SelectItem>
                          <SelectItem value="west-indies">West Indies</SelectItem>
                          <SelectItem value="sri-lanka">Sri Lanka</SelectItem>
                          <SelectItem value="bangladesh">Bangladesh</SelectItem>
                          <SelectItem value="afghanistan">Afghanistan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Active From</Label>
                      <Input
                        type="date"
                        value={activeFrom}
                        onChange={(e) => setActiveFrom(e.target.value)}
                        className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                      />
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Active To</Label>
                      <Input
                        type="date"
                        value={activeTo}
                        onChange={(e) => setActiveTo(e.target.value)}
                        className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                {/* Tournaments */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Tournament Achievements</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Tournaments Won</Label>
                      <Input
                        value={tournamentsWon}
                        onChange={(e) => setTournamentsWon(e.target.value)}
                        className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                        placeholder="e.g., ICC World Cup 2011, 2023"
                      />
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Tournament Captains</Label>
                      <Input
                        value={tournamentsCaptains}
                        onChange={(e) => setTournamentsCaptains(e.target.value)}
                        className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                        placeholder="e.g., MS Dhoni, Rohit Sharma"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Jersey Upload */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-full">
              <CardHeader>
                <CardTitle className="text-lg">Team Jersey</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Jersey Type Tabs */}
                <Tabs value={jerseyTab} onValueChange={(v: any) => setJerseyTab(v as 'limited' | 'test')}>
                  <TabsList className="w-full bg-slate-100 dark:bg-slate-900">
                    <TabsTrigger value="limited" className="flex-1">Limited</TabsTrigger>
                    <TabsTrigger value="test" className="flex-1">Test</TabsTrigger>
                  </TabsList>

                  <TabsContent value="limited" className="mt-4">
                    <div className="space-y-4">
                      <Label className="text-slate-900 dark:text-slate-300">Limited Jersey</Label>
                      <ImageUpload
                        value={jerseyLimitedPreview || undefined}
                        onChange={(file, preview) => setJerseyLimitedPreview(preview)}
                        label=""
                      />
                      {!jerseyLimitedPreview && (
                        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-600 rounded-lg bg-slate-900/50">
                          <div className="w-32 flex flex-col items-center">
                            {/* Player Head */}
                            <img
                              src="/src/assets/player/1BJ.webp"
                              alt="Player"
                              className="w-32 h-32 -mb-[35px] object-cover rounded-full"
                            />
                            {/* Jersey/T-shirt */}
                            <img
                              src="/src/assets/player/limited-jersey.png"
                              alt="Limited Jersey"
                              className="w-28 h-28 object-contain -mt-3"
                            />
                          </div>
                          <p className="text-sm text-slate-400 mt-2">Demo Jersey Preview</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="test" className="mt-4">
                    <div className="space-y-4">
                      <Label className="text-slate-900 dark:text-slate-300">Test Jersey</Label>
                      <ImageUpload
                        value={jerseyTestPreview || undefined}
                        onChange={(file, preview) => setJerseyTestPreview(preview)}
                        label=""
                      />
                      {!jerseyTestPreview && (
                        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-600 rounded-lg bg-slate-900/50">
                          <div className="w-32 flex flex-col items-center">
                            {/* Player Head */}
                            <img
                              src="/src/assets/player/1BJ.webp"
                              alt="Player"
                              className="w-32 h-32 -mb-[35px] object-cover rounded-full"
                            />
                            {/* Jersey/T-shirt */}
                            <img
                              src="/src/assets/player/test-jersey.png"
                              alt="Test Jersey"
                              className="w-28 h-28 object-contain -mt-3"
                            />
                          </div>
                          <p className="text-sm text-slate-400 mt-2">Demo Jersey Preview</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
