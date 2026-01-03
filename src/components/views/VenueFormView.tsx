"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Upload, Plus, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { RichTextEditor } from "../ui/RichTextEditor";
import { venueService } from "../../services/venue.service";
import { venueStatsService } from "../../services/venue-stats.service";
import { CreateVenueDto } from "../../types/venue";
import { UpsertVenueStatsDto, FormatStats } from "../../types/venue-stats";

export function VenueFormView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState("basic-info");
  const [pitchGender, setPitchGender] = useState("men");
  const [pitchFormat, setPitchFormat] = useState("all");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingBio, setUpdatingBio] = useState(false);
  const [savingStats, setSavingStats] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Stats state
  const [statsData, setStatsData] = useState<UpsertVenueStatsDto>({
    odi: {},
    t20: {},
    firstClass: {},
    domesticT20: {},
    ipl: {},
  });

  // Track which match ID fields are being edited
  const [editingMatchId, setEditingMatchId] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState<CreateVenueDto>({
    name: "",
    city: "",
    state: "",
    country: "",
    capacity: 0,
    established: new Date().getFullYear(),
    yearOfFirstMatch: undefined,
    knownAs: "",
    association: "",
    timezone: "",
    coordinates: {
      lat: 0,
      lng: 0,
    },
    pitchType: "balanced",
    avgFirstInningsScore: {
      test: undefined,
      odi: undefined,
      t20: undefined,
    },
    groundSize: "medium",
    groundDimensions: {
      topEndName: "",
      bottomEndName: "",
      distances: {
        top: undefined,
        topRight: undefined,
        right: undefined,
        bottomRight: undefined,
        bottom: undefined,
        bottomLeft: undefined,
        left: undefined,
        topLeft: undefined,
      },
    },
    pitchDescription: {
      dusty: "",
      green: "",
      dead: "",
    },
    suitedFor: undefined,
    bio: "",
    isActive: true,
  });

  // Load venue data and stats if editing
  useEffect(() => {
    if (isEdit && id) {
      loadVenue(id);
      loadVenueStats(id);
    }
  }, [isEdit, id]);

  const loadVenue = async (venueId: string) => {
    try {
      setLoading(true);
      const response = await venueService.getVenue(venueId);
      if (response.status && response.data.result) {
        setFormData(response.data.result as CreateVenueDto);
      }
    } catch (error: any) {
      console.error("Failed to load venue:", error);
      toast.error(error.response?.data?.userMessage || "Failed to load venue");
    } finally {
      setLoading(false);
    }
  };

  const loadVenueStats = async (venueId: string) => {
    try {
      setLoadingStats(true);
      const response = await venueStatsService.getStats(venueId);
      if (response.status && response.data?.result) {
        setStatsData({
          odi: response.data.result.odi || {},
          t20: response.data.result.t20 || {},
          firstClass: response.data.result.firstClass || {},
          domesticT20: response.data.result.domesticT20 || {},
          ipl: response.data.result.ipl || {},
        });
      }
    } catch (error: any) {
      console.error("Failed to load venue stats:", error);
      // Don't show error toast - stats might not exist yet
    } finally {
      setLoadingStats(false);
    }
  };

  const cleanFormData = (data: any): any => {
    // Remove MongoDB _id fields and timestamps from nested objects
    const clean = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(item => clean(item));
      }
      
      const cleaned: any = {};
      for (const key in obj) {
        // Skip _id, createdAt, updatedAt fields
        if (key === '_id' || key === 'createdAt' || key === 'updatedAt' || key === '__v') {
          continue;
        }
        cleaned[key] = clean(obj[key]);
      }
      return cleaned;
    };
    
    return clean(data);
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.city || !formData.country || !formData.capacity) {
        toast.error("Please fill in all required fields");
        return;
      }

      setSubmitting(true);

      // Clean form data to remove _id and timestamp fields
      const cleanedData = cleanFormData(formData);

      if (isEdit && id) {
        const response = await venueService.updateVenue(id, cleanedData);
        if (response.status) {
          toast.success(response.userMessage || "Venue updated successfully");
          navigate("/venues");
        }
      } else {
        const response = await venueService.createVenue(cleanedData);
        if (response.status) {
          toast.success(response.userMessage || "Venue created successfully");
          navigate("/venues");
        }
      }
    } catch (error: any) {
      console.error("Failed to save venue:", error);
      toast.error(error.response?.data?.userMessage || "Failed to save venue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBio = async () => {
    if (!isEdit || !id) {
      toast.error("Please save the venue first before updating bio");
      return;
    }

    try {
      setUpdatingBio(true);

      // Only send bio field for update
      const response = await venueService.updateVenue(id, {
        bio: formData.bio,
      });

      if (response.status) {
        toast.success(response.userMessage || "Bio updated successfully");
        // Optionally reload the venue data
        await loadVenue(id);
      }
    } catch (error: any) {
      console.error("Failed to update bio:", error);
      toast.error(error.response?.data?.userMessage || "Failed to update bio");
    } finally {
      setUpdatingBio(false);
    }
  };

  const handleSaveStats = async () => {
    if (!isEdit || !id) {
      toast.error("Please save the venue first before adding stats");
      return;
    }

    try {
      setSavingStats(true);

      const response = await venueStatsService.upsertStats(id, statsData);

      if (response.status) {
        toast.success(response.userMessage || "Venue stats saved successfully");
      }
    } catch (error: any) {
      console.error("Failed to save venue stats:", error);
      toast.error(error.response?.data?.userMessage || "Failed to save venue stats");
    } finally {
      setSavingStats(false);
    }
  };

  const updateStatsData = (format: keyof UpsertVenueStatsDto, field: keyof FormatStats, value: any) => {
    // Determine if field should be a number based on field name
    const numberFields = ['matches', 'winBatFirst', 'winBowlFirst', 'avg1stInn', 'avg2ndInn', 'avg3rdInn', 'avg4thInn'];
    const isNumberField = numberFields.includes(field as string);
    
    let processedValue;
    if (value === "" || value === null || value === undefined) {
      processedValue = undefined;
    } else if (isNumberField) {
      const numValue = Number(value);
      processedValue = isNaN(numValue) ? undefined : numValue; // Allow 0
    } else {
      processedValue = value;
    }
    
    setStatsData((prev) => ({
      ...prev,
      [format]: {
        ...prev[format],
        [field]: processedValue,
      },
    }));
  };

  const toggleMatchIdEdit = (key: string) => {
    setEditingMatchId((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNestedFormData = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof CreateVenueDto] as any),
        [field]: value,
      },
    }));
  };

  const updateDeepNestedFormData = (parent: string, child: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof CreateVenueDto] as any),
        [child]: {
          ...((prev[parent as keyof CreateVenueDto] as any)?.[child] || {}),
          [field]: value,
        },
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate("/venues")}>
            Venues
          </span>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">
            {isEdit ? "Edit Venue" : "Add Venue"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/venues")}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isEdit ? "Edit Venue" : "Add New Venue"}
            </h1>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-100 dark:bg-slate-800 p-1">
            <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
            <TabsTrigger value="venue-stats">Venue Stats</TabsTrigger>
            <TabsTrigger value="venue-bio">Venue Bio</TabsTrigger>
          </TabsList>

          <TabsContent value="basic-info" className="mt-6 space-y-6">
            {/* Basic Info Header */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {/* Language Tabs Placeholder */}
                <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">English</Button>
                <Button variant="ghost" size="sm">Hindi</Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/venues")} disabled={submitting}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {submitting ? "Saving..." : (isEdit ? "Update Venue" : "Save Venue")}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Ground Info Section */}
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg">Ground Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label>Ground Size</Label>
                        <Select value={formData.groundSize} onValueChange={(value) => updateFormData("groundSize", value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select ground size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                     <div className="col-span-2">
                    <Label>Ground Dimensions</Label>

                      <div className="mt-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-8 border border-slate-200 dark:border-slate-700">
                        <div className="relative w-full max-w-md mx-auto aspect-square">

                          {/* Circle */}
                          <div className="absolute inset-0 rounded-full bg-green-600 shadow-xl border-4 border-slate-700 dark:border-slate-600"></div>

                          {/* Pitch */}
                          <div 
                            className="absolute top-1/2 left-1/2 w-[50px] h-[150px] bg-[#944704] rounded-sm shadow-lg -translate-x-1/2 -translate-y-1/2"
                          ></div>

                          {/* top end here input */}
                          <div
                            className="absolute flex flex-col items-center"
                            style={{
                              left: `calc(50% + ${0}px)`,
                              top: `calc(50% - ${240}px)`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <Input 
                              className="w-40 h-8 text-center text-xs placeholder-slate-500 dark:placeholder-slate-400" 
                              placeholder="Enter end name"
                              value={formData.groundDimensions?.topEndName ?? ""}
                              onChange={(e) => updateNestedFormData("groundDimensions", "topEndName", e.target.value)}
                            />
                          </div>

                          {/* bottom end here input */}
                           <div
                            className="absolute flex flex-col items-center"
                            style={{
                              left: `calc(50% + ${0}px)`,
                              bottom: `calc(50% + ${-270}px)`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <Input 
                              className="w-40 h-8 text-center text-xs placeholder-slate-500 dark:placeholder-slate-400" 
                              placeholder="Enter end name"
                              value={formData.groundDimensions?.bottomEndName ?? ""}
                              onChange={(e) => updateNestedFormData("groundDimensions", "bottomEndName", e.target.value)}
                            />
                          </div>


                          {/** Math Constants */}
                          {/** radius = distance from center */}
                          {/** center = 50%/50% of container */}

                          {/** ---------- TOP (270°) ---------- */}
                          <div
                            className="absolute flex flex-col items-center"
                            style={{
                              left: `calc(50% + ${0}px)`,
                              top: `calc(50% - ${160}px)`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <Input 
                              className="w-16 h-8 text-center text-xs" 
                              type="number"
                              placeholder="79"
                              value={formData.groundDimensions?.distances?.top ?? ""}
                              onChange={(e) => updateDeepNestedFormData("groundDimensions", "distances", "top", e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </div>

                          {/** ---------- TOP-RIGHT (315°) ---------- */}
                          <div
                            className="absolute flex flex-col items-center"
                            style={{
                              left: `calc(50% + ${160 * Math.cos(315 * Math.PI / 180)}px)`,
                              top:  `calc(50% + ${160 * Math.sin(315 * Math.PI / 180)}px)`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <Input 
                              className="w-16 h-8 text-center text-xs" 
                              type="number"
                              placeholder="57"
                              value={formData.groundDimensions?.distances?.topRight ?? ""}
                              onChange={(e) => updateDeepNestedFormData("groundDimensions", "distances", "topRight", e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </div>

                          {/** ---------- RIGHT (0°) ---------- */}
                          <div
                            className="absolute flex flex-col items-center"
                            style={{
                              left: `calc(50% + ${160}px)`,
                              top: `calc(50% + ${0}px)`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <Input 
                              className="w-16 h-8 text-center text-xs" 
                              type="number"
                              placeholder="62"
                              value={formData.groundDimensions?.distances?.right ?? ""}
                              onChange={(e) => updateDeepNestedFormData("groundDimensions", "distances", "right", e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </div>

                          {/** ---------- BOTTOM-RIGHT (45°) ---------- */}
                          <div
                            className="absolute flex flex-col items-center"
                            style={{
                              left: `calc(50% + ${160 * Math.cos(45 * Math.PI / 180)}px)`,
                              top:  `calc(50% + ${160 * Math.sin(45 * Math.PI / 180)}px)`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <Input 
                              className="w-16 h-8 text-center text-xs" 
                              type="number"
                              placeholder="70"
                              value={formData.groundDimensions?.distances?.bottomRight ?? ""}
                              onChange={(e) => updateDeepNestedFormData("groundDimensions", "distances", "bottomRight", e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </div>

                          {/** ---------- BOTTOM (90°) ---------- */}
                          <div
                            className="absolute flex flex-col items-center"
                            style={{
                              left: `calc(50% + ${0}px)`,
                              top: `calc(50% + ${160}px)`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <Input 
                              className="w-16 h-8 text-center text-xs" 
                              type="number"
                              placeholder="82"
                              value={formData.groundDimensions?.distances?.bottom ?? ""}
                              onChange={(e) => updateDeepNestedFormData("groundDimensions", "distances", "bottom", e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </div>

                          {/** ---------- BOTTOM-LEFT (135°) ---------- */}
                          <div
                            className="absolute flex flex-col items-center"
                            style={{
                              left: `calc(50% + ${160 * Math.cos(135 * Math.PI / 180)}px)`,
                              top:  `calc(50% + ${160 * Math.sin(135 * Math.PI / 180)}px)`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <Input 
                              className="w-16 h-8 text-center text-xs" 
                              type="number"
                              placeholder="81"
                              value={formData.groundDimensions?.distances?.bottomLeft ?? ""}
                              onChange={(e) => updateDeepNestedFormData("groundDimensions", "distances", "bottomLeft", e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </div>

                          {/** ---------- LEFT (180°) ---------- */}
                          <div
                            className="absolute flex flex-col items-center"
                            style={{
                              left: `calc(50% - ${160}px)`,
                              top: `calc(50% + 0px)`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <Input 
                              className="w-16 h-8 text-center text-xs" 
                              type="number"
                              placeholder="74"
                              value={formData.groundDimensions?.distances?.left ?? ""}
                              onChange={(e) => updateDeepNestedFormData("groundDimensions", "distances", "left", e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </div>

                          {/** ---------- TOP-LEFT (225°) ---------- */}
                          <div
                            className="absolute flex flex-col items-center"
                            style={{
                              left: `calc(50% + ${160 * Math.cos(225 * Math.PI / 180)}px)`,
                              top:  `calc(50% + ${160 * Math.sin(225 * Math.PI / 180)}px)`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <Input 
                              className="w-16 h-8 text-center text-xs" 
                              type="number"
                              placeholder="61"
                              value={formData.groundDimensions?.distances?.topLeft ?? ""}
                              onChange={(e) => updateDeepNestedFormData("groundDimensions", "distances", "topLeft", e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </div>

                        </div>
                      </div>
                    </div>

                    </div>

                  </CardContent>
                </Card>

                {/* Pitch Behaviour Section */}
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg">Pitch Behaviour</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Tabs value={pitchGender} onValueChange={setPitchGender} className="w-full">
                      <TabsList className="w-full justify-start bg-transparent border-b border-slate-200 dark:border-slate-700 rounded-none h-auto p-0">
                        <TabsTrigger 
                          value="men" 
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-2"
                        >
                          Men
                        </TabsTrigger>
                        <TabsTrigger 
                          value="women" 
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-4 py-2"
                        >
                          Women
                        </TabsTrigger>
                      </TabsList>

                      <div className="mt-4">
                        <Tabs value={pitchFormat} onValueChange={setPitchFormat} className="w-full">
                          <TabsList className="bg-slate-100 dark:bg-slate-900">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="t20">T20</TabsTrigger>
                            <TabsTrigger value="odi">ODI</TabsTrigger>
                            <TabsTrigger value="test">Test</TabsTrigger>
                            <TabsTrigger value="ipl">IPL</TabsTrigger>
                            <TabsTrigger value="cpl">CPL</TabsTrigger>
                          </TabsList>

                          <TabsContent value="all" className="mt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Overall Behaviour</Label>
                                <Select value={formData.pitchType} onValueChange={(value: any) => updateFormData("pitchType", value)}>
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select behaviour" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="batting">Batting Friendly</SelectItem>
                                    <SelectItem value="bowling">Bowling Friendly</SelectItem>
                                    <SelectItem value="balanced">Balanced</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Suited For</Label>
                                <Select value={formData.suitedFor} onValueChange={(value: any) => updateFormData("suitedFor", value)}>
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select suitability" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pace">Pace</SelectItem>
                                    <SelectItem value="spin">Spin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                              <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                                  <TableRow>
                                    <TableHead>Behaviour</TableHead>
                                    <TableHead>Match</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow>
                                    <TableCell>Batting</TableCell>
                                    <TableCell>12</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>Bowling</TableCell>
                                    <TableCell>8</TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>Balanced</TableCell>
                                    <TableCell>5</TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </TabsContent>
                          {/* Other tabs content placeholders */}
                          <TabsContent value="t20"><div className="p-4 text-center text-slate-500">T20 Data</div></TabsContent>
                          <TabsContent value="odi"><div className="p-4 text-center text-slate-500">ODI Data</div></TabsContent>
                          <TabsContent value="test"><div className="p-4 text-center text-slate-500">Test Data</div></TabsContent>
                          <TabsContent value="ipl"><div className="p-4 text-center text-slate-500">IPL Data</div></TabsContent>
                          <TabsContent value="cpl"><div className="p-4 text-center text-slate-500">CPL Data</div></TabsContent>
                        </Tabs>
                      </div>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Location Section */}
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg">Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Latitude</Label>
                        <Input 
                          className="mt-1" 
                          type="number"
                          step="0.0001"
                          placeholder="e.g. 19.0760"
                          value={formData.coordinates?.lat ?? ""}
                          onChange={(e) => updateNestedFormData("coordinates", "lat", e.target.value ? Number(e.target.value) : 0)}
                        />
                      </div>
                      <div>
                        <Label>Longitude</Label>
                        <Input 
                          className="mt-1" 
                          type="number"
                          step="0.0001"
                          placeholder="e.g. 72.8777"
                          value={formData.coordinates?.lng ?? ""}
                          onChange={(e) => updateNestedFormData("coordinates", "lng", e.target.value ? Number(e.target.value) : 0)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Right Column */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-full">
                   <CardHeader>
                    <CardTitle className="text-lg">Venue Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                       <div>
                        <Label>Name <span className="text-red-500">*</span></Label>
                        <Input 
                          className="mt-1" 
                          placeholder="Venue Name"
                          value={formData.name}
                          onChange={(e) => updateFormData("name", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label>City <span className="text-red-500">*</span></Label>
                        <Input 
                          className="mt-1" 
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => updateFormData("city", e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input 
                          className="mt-1" 
                          placeholder="State"
                          value={formData.state ?? ""}
                          onChange={(e) => updateFormData("state", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Country <span className="text-red-500">*</span></Label>
                        <Input 
                          className="mt-1" 
                          placeholder="Country"
                          value={formData.country}
                          onChange={(e) => updateFormData("country", e.target.value)}
                          required
                        />
                      </div>
                       <div>
                        <Label>Capacity <span className="text-red-500">*</span></Label>
                        <Input 
                          className="mt-1" 
                          placeholder="Capacity" 
                          type="number"
                          value={formData.capacity ?? ""}
                          onChange={(e) => updateFormData("capacity", e.target.value ? Number(e.target.value) : 0)}
                          required
                        />
                      </div>
                       <div>
                        <Label>Established Year</Label>
                        <Input 
                          className="mt-1" 
                          placeholder="Year" 
                          type="number"
                          value={formData.established ?? ""}
                          onChange={(e) => updateFormData("established", e.target.value ? Number(e.target.value) : new Date().getFullYear())}
                        />
                      </div>
                      <div>
                        <Label>Year of First Match</Label>
                        <Input 
                          className="mt-1" 
                          placeholder="Year" 
                          type="number"
                          value={formData.yearOfFirstMatch ?? ""}
                          onChange={(e) => updateFormData("yearOfFirstMatch", e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </div>
                      <div>
                        <Label>Known As</Label>
                        <Input 
                          className="mt-1" 
                          placeholder="Known as (nickname)"
                          value={formData.knownAs ?? ""}
                          onChange={(e) => updateFormData("knownAs", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Association</Label>
                        <Input 
                          className="mt-1" 
                          placeholder="Association Name"
                          value={formData.association ?? ""}
                          onChange={(e) => updateFormData("association", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Timezone</Label>
                        <Input 
                          className="mt-1" 
                          placeholder="e.g. Asia/Kolkata"
                          value={formData.timezone ?? ""}
                          onChange={(e) => updateFormData("timezone", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <Label className="mb-2 block">Pitch Description</Label>
                      <Tabs defaultValue="dusty" className="w-full">
                        <TabsList className="bg-slate-100 dark:bg-slate-900 w-full justify-start">
                          <TabsTrigger value="dusty">Dusty</TabsTrigger>
                          <TabsTrigger value="green">Green</TabsTrigger>
                          <TabsTrigger value="dead">Dead</TabsTrigger>
                        </TabsList>
                        <TabsContent value="dusty" className="mt-2">
                          <RichTextEditor 
                            value={formData.pitchDescription?.dusty ?? ""} 
                            onChange={(value) => updateNestedFormData("pitchDescription", "dusty", value)} 
                            placeholder="Describe dusty pitch conditions..."
                            className="min-h-[200px]"
                          />
                        </TabsContent>
                        <TabsContent value="green" className="mt-2">
                          <RichTextEditor 
                            value={formData.pitchDescription?.green ?? ""} 
                            onChange={(value) => updateNestedFormData("pitchDescription", "green", value)} 
                            placeholder="Describe green pitch conditions..."
                            className="min-h-[200px]"
                          />
                        </TabsContent>
                        <TabsContent value="dead" className="mt-2">
                          <RichTextEditor 
                            value={formData.pitchDescription?.dead ?? ""} 
                            onChange={(value) => updateNestedFormData("pitchDescription", "dead", value)} 
                            placeholder="Describe dead pitch conditions..."
                            className="min-h-[200px]"
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="venue-stats" className="mt-6 space-y-6">
            <div className="flex justify-end">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                onClick={handleSaveStats}
                disabled={savingStats || !isEdit}
              >
                {savingStats ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingStats ? "Saving..." : "Save Stats"}
              </Button>
            </div>

            {loadingStats ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-100 dark:bg-slate-900">
                    <TableRow>
                      <TableHead className="w-[200px] font-semibold text-slate-900 dark:text-slate-100">Category</TableHead>
                      <TableHead className="min-w-[150px]">ODI</TableHead>
                      <TableHead className="min-w-[150px]">T20</TableHead>
                      <TableHead className="min-w-[150px]">First Class</TableHead>
                      <TableHead className="min-w-[150px]">Domestic T20</TableHead>
                      <TableHead className="min-w-[150px]">IPL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                      <TableRow>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/20 py-4">Matches</TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.odi?.matches ?? ""} onChange={(e) => updateStatsData("odi", "matches", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.t20?.matches ?? ""} onChange={(e) => updateStatsData("t20", "matches", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.firstClass?.matches ?? ""} onChange={(e) => updateStatsData("firstClass", "matches", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.domesticT20?.matches ?? ""} onChange={(e) => updateStatsData("domesticT20", "matches", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.ipl?.matches ?? ""} onChange={(e) => updateStatsData("ipl", "matches", e.target.value)} />
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/20 py-4">Win Bat First</TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.odi?.winBatFirst ?? ""} onChange={(e) => updateStatsData("odi", "winBatFirst", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.t20?.winBatFirst ?? ""} onChange={(e) => updateStatsData("t20", "winBatFirst", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.firstClass?.winBatFirst ?? ""} onChange={(e) => updateStatsData("firstClass", "winBatFirst", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.domesticT20?.winBatFirst ?? ""} onChange={(e) => updateStatsData("domesticT20", "winBatFirst", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.ipl?.winBatFirst ?? ""} onChange={(e) => updateStatsData("ipl", "winBatFirst", e.target.value)} />
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/20 py-4">Win Bowl First</TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.odi?.winBowlFirst ?? ""} onChange={(e) => updateStatsData("odi", "winBowlFirst", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.t20?.winBowlFirst ?? ""} onChange={(e) => updateStatsData("t20", "winBowlFirst", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.firstClass?.winBowlFirst ?? ""} onChange={(e) => updateStatsData("firstClass", "winBowlFirst", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.domesticT20?.winBowlFirst ?? ""} onChange={(e) => updateStatsData("domesticT20", "winBowlFirst", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.ipl?.winBowlFirst ?? ""} onChange={(e) => updateStatsData("ipl", "winBowlFirst", e.target.value)} />
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/20 py-4">Avg 1st Inn</TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.odi?.avg1stInn ?? ""} onChange={(e) => updateStatsData("odi", "avg1stInn", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.t20?.avg1stInn ?? ""} onChange={(e) => updateStatsData("t20", "avg1stInn", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.firstClass?.avg1stInn ?? ""} onChange={(e) => updateStatsData("firstClass", "avg1stInn", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.domesticT20?.avg1stInn ?? ""} onChange={(e) => updateStatsData("domesticT20", "avg1stInn", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.ipl?.avg1stInn ?? ""} onChange={(e) => updateStatsData("ipl", "avg1stInn", e.target.value)} />
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/20 py-4">Avg 2nd Inn</TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.odi?.avg2ndInn ?? ""} onChange={(e) => updateStatsData("odi", "avg2ndInn", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.t20?.avg2ndInn ?? ""} onChange={(e) => updateStatsData("t20", "avg2ndInn", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.firstClass?.avg2ndInn ?? ""} onChange={(e) => updateStatsData("firstClass", "avg2ndInn", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.domesticT20?.avg2ndInn ?? ""} onChange={(e) => updateStatsData("domesticT20", "avg2ndInn", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.ipl?.avg2ndInn ?? ""} onChange={(e) => updateStatsData("ipl", "avg2ndInn", e.target.value)} />
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/20 py-4">Avg 3rd Inn</TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.odi?.avg3rdInn ?? ""} onChange={(e) => updateStatsData("odi", "avg3rdInn", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.t20?.avg3rdInn ?? ""} onChange={(e) => updateStatsData("t20", "avg3rdInn", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.firstClass?.avg3rdInn ?? ""} onChange={(e) => updateStatsData("firstClass", "avg3rdInn", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.domesticT20?.avg3rdInn ?? ""} onChange={(e) => updateStatsData("domesticT20", "avg3rdInn", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.ipl?.avg3rdInn ?? ""} onChange={(e) => updateStatsData("ipl", "avg3rdInn", e.target.value)} />
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/20 py-4">Avg 4th Inn</TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.odi?.avg4thInn ?? ""} onChange={(e) => updateStatsData("odi", "avg4thInn", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.t20?.avg4thInn ?? ""} onChange={(e) => updateStatsData("t20", "avg4thInn", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.firstClass?.avg4thInn ?? ""} onChange={(e) => updateStatsData("firstClass", "avg4thInn", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.domesticT20?.avg4thInn ?? ""} onChange={(e) => updateStatsData("domesticT20", "avg4thInn", e.target.value)} />
                        </TableCell>
                        <TableCell className="py-2">
                          <Input type="number" min="0" className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="-" value={statsData.ipl?.avg4thInn ?? ""} onChange={(e) => updateStatsData("ipl", "avg4thInn", e.target.value)} />
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/20 py-4">Highest Total</TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 450/3)" value={statsData.odi?.highestTotal ?? ""} onChange={(e) => updateStatsData("odi", "highestTotal", e.target.value)} />
                          {editingMatchId["odi-highestTotal"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.odi?.highestTotalMatchId ?? ""} onChange={(e) => updateStatsData("odi", "highestTotalMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("odi-highestTotal")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("odi-highestTotal")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.odi?.highestTotalMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 220/4)" value={statsData.t20?.highestTotal ?? ""} onChange={(e) => updateStatsData("t20", "highestTotal", e.target.value)} />
                          {editingMatchId["t20-highestTotal"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.t20?.highestTotalMatchId ?? ""} onChange={(e) => updateStatsData("t20", "highestTotalMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("t20-highestTotal")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("t20-highestTotal")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.t20?.highestTotalMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 657/7d)" value={statsData.firstClass?.highestTotal ?? ""} onChange={(e) => updateStatsData("firstClass", "highestTotal", e.target.value)} />
                          {editingMatchId["firstClass-highestTotal"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.firstClass?.highestTotalMatchId ?? ""} onChange={(e) => updateStatsData("firstClass", "highestTotalMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("firstClass-highestTotal")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("firstClass-highestTotal")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.firstClass?.highestTotalMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 210/5)" value={statsData.domesticT20?.highestTotal ?? ""} onChange={(e) => updateStatsData("domesticT20", "highestTotal", e.target.value)} />
                          {editingMatchId["domesticT20-highestTotal"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.domesticT20?.highestTotalMatchId ?? ""} onChange={(e) => updateStatsData("domesticT20", "highestTotalMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("domesticT20-highestTotal")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("domesticT20-highestTotal")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.domesticT20?.highestTotalMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 235/3)" value={statsData.ipl?.highestTotal ?? ""} onChange={(e) => updateStatsData("ipl", "highestTotal", e.target.value)} />
                          {editingMatchId["ipl-highestTotal"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.ipl?.highestTotalMatchId ?? ""} onChange={(e) => updateStatsData("ipl", "highestTotalMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("ipl-highestTotal")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("ipl-highestTotal")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.ipl?.highestTotalMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/20 py-4">Lowest Total</TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 58)" value={statsData.odi?.lowestTotal ?? ""} onChange={(e) => updateStatsData("odi", "lowestTotal", e.target.value)} />
                          {editingMatchId["odi-lowestTotal"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.odi?.lowestTotalMatchId ?? ""} onChange={(e) => updateStatsData("odi", "lowestTotalMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("odi-lowestTotal")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("odi-lowestTotal")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.odi?.lowestTotalMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 92)" value={statsData.t20?.lowestTotal ?? ""} onChange={(e) => updateStatsData("t20", "lowestTotal", e.target.value)} />
                          {editingMatchId["t20-lowestTotal"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.t20?.lowestTotalMatchId ?? ""} onChange={(e) => updateStatsData("t20", "lowestTotalMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("t20-lowestTotal")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("t20-lowestTotal")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.t20?.lowestTotalMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 42)" value={statsData.firstClass?.lowestTotal ?? ""} onChange={(e) => updateStatsData("firstClass", "lowestTotal", e.target.value)} />
                          {editingMatchId["firstClass-lowestTotal"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.firstClass?.lowestTotalMatchId ?? ""} onChange={(e) => updateStatsData("firstClass", "lowestTotalMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("firstClass-lowestTotal")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("firstClass-lowestTotal")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.firstClass?.lowestTotalMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 85)" value={statsData.domesticT20?.lowestTotal ?? ""} onChange={(e) => updateStatsData("domesticT20", "lowestTotal", e.target.value)} />
                          {editingMatchId["domesticT20-lowestTotal"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.domesticT20?.lowestTotalMatchId ?? ""} onChange={(e) => updateStatsData("domesticT20", "lowestTotalMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("domesticT20-lowestTotal")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("domesticT20-lowestTotal")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.domesticT20?.lowestTotalMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 49)" value={statsData.ipl?.lowestTotal ?? ""} onChange={(e) => updateStatsData("ipl", "lowestTotal", e.target.value)} />
                          {editingMatchId["ipl-lowestTotal"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.ipl?.lowestTotalMatchId ?? ""} onChange={(e) => updateStatsData("ipl", "lowestTotalMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("ipl-lowestTotal")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("ipl-lowestTotal")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.ipl?.lowestTotalMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/20 py-4">Highest Chased</TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 340/5)" value={statsData.odi?.highestChased ?? ""} onChange={(e) => updateStatsData("odi", "highestChased", e.target.value)} />
                          {editingMatchId["odi-highestChased"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.odi?.highestChasedMatchId ?? ""} onChange={(e) => updateStatsData("odi", "highestChasedMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("odi-highestChased")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("odi-highestChased")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.odi?.highestChasedMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 190/4)" value={statsData.t20?.highestChased ?? ""} onChange={(e) => updateStatsData("t20", "highestChased", e.target.value)} />
                          {editingMatchId["t20-highestChased"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.t20?.highestChasedMatchId ?? ""} onChange={(e) => updateStatsData("t20", "highestChasedMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("t20-highestChased")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("t20-highestChased")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.t20?.highestChasedMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 418/7)" value={statsData.firstClass?.highestChased ?? ""} onChange={(e) => updateStatsData("firstClass", "highestChased", e.target.value)} />
                          {editingMatchId["firstClass-highestChased"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.firstClass?.highestChasedMatchId ?? ""} onChange={(e) => updateStatsData("firstClass", "highestChasedMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("firstClass-highestChased")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("firstClass-highestChased")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.firstClass?.highestChasedMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 195/3)" value={statsData.domesticT20?.highestChased ?? ""} onChange={(e) => updateStatsData("domesticT20", "highestChased", e.target.value)} />
                          {editingMatchId["domesticT20-highestChased"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.domesticT20?.highestChasedMatchId ?? ""} onChange={(e) => updateStatsData("domesticT20", "highestChasedMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("domesticT20-highestChased")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("domesticT20-highestChased")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.domesticT20?.highestChasedMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 203/5)" value={statsData.ipl?.highestChased ?? ""} onChange={(e) => updateStatsData("ipl", "highestChased", e.target.value)} />
                          {editingMatchId["ipl-highestChased"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.ipl?.highestChasedMatchId ?? ""} onChange={(e) => updateStatsData("ipl", "highestChasedMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("ipl-highestChased")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("ipl-highestChased")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.ipl?.highestChasedMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/20 py-4">Lowest Defended</TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 140)" value={statsData.odi?.lowestDefended ?? ""} onChange={(e) => updateStatsData("odi", "lowestDefended", e.target.value)} />
                          {editingMatchId["odi-lowestDefended"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.odi?.lowestDefendedMatchId ?? ""} onChange={(e) => updateStatsData("odi", "lowestDefendedMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("odi-lowestDefended")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("odi-lowestDefended")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.odi?.lowestDefendedMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 135)" value={statsData.t20?.lowestDefended ?? ""} onChange={(e) => updateStatsData("t20", "lowestDefended", e.target.value)} />
                          {editingMatchId["t20-lowestDefended"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.t20?.lowestDefendedMatchId ?? ""} onChange={(e) => updateStatsData("t20", "lowestDefendedMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("t20-lowestDefended")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("t20-lowestDefended")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.t20?.lowestDefendedMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 107)" value={statsData.firstClass?.lowestDefended ?? ""} onChange={(e) => updateStatsData("firstClass", "lowestDefended", e.target.value)} />
                          {editingMatchId["firstClass-lowestDefended"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.firstClass?.lowestDefendedMatchId ?? ""} onChange={(e) => updateStatsData("firstClass", "lowestDefendedMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("firstClass-lowestDefended")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("firstClass-lowestDefended")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.firstClass?.lowestDefendedMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 125)" value={statsData.domesticT20?.lowestDefended ?? ""} onChange={(e) => updateStatsData("domesticT20", "lowestDefended", e.target.value)} />
                          {editingMatchId["domesticT20-lowestDefended"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.domesticT20?.lowestDefendedMatchId ?? ""} onChange={(e) => updateStatsData("domesticT20", "lowestDefendedMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("domesticT20-lowestDefended")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("domesticT20-lowestDefended")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.domesticT20?.lowestDefendedMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input className="h-12 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900" placeholder="Score (e.g., 144)" value={statsData.ipl?.lowestDefended ?? ""} onChange={(e) => updateStatsData("ipl", "lowestDefended", e.target.value)} />
                          {editingMatchId["ipl-lowestDefended"] ? (
                            <Input className="h-10 bg-slate-50 dark:bg-slate-900/50 text-sm mt-2" placeholder="Match ID" value={statsData.ipl?.lowestDefendedMatchId ?? ""} onChange={(e) => updateStatsData("ipl", "lowestDefendedMatchId", e.target.value)} onBlur={() => toggleMatchIdEdit("ipl-lowestDefended")} autoFocus />
                          ) : (
                            <button type="button" onClick={() => toggleMatchIdEdit("ipl-lowestDefended")} className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              <Pencil className="h-3 w-3" />
                              {statsData.ipl?.lowestDefendedMatchId ? "Edit Match ID" : "Add Match ID"}
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            )}
          </TabsContent>

          <TabsContent value="venue-bio" className="mt-6 space-y-6">
            <div className="flex justify-end">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                onClick={handleUpdateBio}
                disabled={updatingBio || !isEdit}
              >
                {updatingBio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {updatingBio ? "Updating..." : "Update Bio"}
              </Button>
            </div>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <RichTextEditor 
                  value={formData.bio ?? ""} 
                  onChange={(value) => updateFormData("bio", value)} 
                  placeholder="Enter venue biography..."
                  className="min-h-[400px]"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
