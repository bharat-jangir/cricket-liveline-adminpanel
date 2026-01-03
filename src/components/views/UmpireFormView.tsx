import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { ImageUpload } from '../ui/ImageUpload';
import { umpireService } from '../../services/umpire.service';
import { CreateUmpireDto } from '../../types/umpire';

export function UmpireFormView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateUmpireDto>({
    name: '',
    dob: '',
    placeOfBirth: '',
    height: '',
    testMatches: 0,
    odiMatches: 0,
    t20Matches: 0,
    otherMatches: 0,
    careerStart: '',
    image: '',
    isActive: true,
  });

  // Load umpire data if editing
  useEffect(() => {
    if (isEdit && id) {
      loadUmpire(id);
    }
  }, [isEdit, id]);

  const loadUmpire = async (umpireId: string) => {
    try {
      setLoading(true);
      const response = await umpireService.getUmpire(umpireId);
      if (response.status && response.data.result) {
        const umpire = response.data.result;
        setFormData({
          name: umpire.name,
          dob: umpire.dob ? new Date(umpire.dob).toISOString().split('T')[0] : '',
          placeOfBirth: umpire.placeOfBirth || '',
          height: umpire.height || '',
          testMatches: umpire.testMatches || 0,
          odiMatches: umpire.odiMatches || 0,
          t20Matches: umpire.t20Matches || 0,
          otherMatches: umpire.otherMatches || 0,
          careerStart: umpire.careerStart || '',
          image: umpire.image || '',
          isActive: umpire.isActive,
        });
        if (umpire.image) {
          setProfilePreview(umpire.image);
        }
      }
    } catch (error: any) {
      console.error('Failed to load umpire:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to load umpire');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const dataToSubmit = {
        ...formData,
        image: profilePreview || undefined,
      };

      if (isEdit && id) {
        const response = await umpireService.updateUmpire(id, dataToSubmit);
        if (response.status) {
          toast.success(response.userMessage || 'Umpire updated successfully');
          navigate('/umpires');
        }
      } else {
        const response = await umpireService.createUmpire(dataToSubmit);
        if (response.status) {
          toast.success(response.userMessage || 'Umpire created successfully');
          navigate('/umpires');
        }
      }
    } catch (error: any) {
      console.error('Failed to save umpire:', error);
      toast.error(error.response?.data?.userMessage || 'Failed to save umpire');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/umpires')}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ChevronLeft className="size-4 mr-1" />
          Back to Umpires
        </Button>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {isEdit ? 'Edit Umpire' : 'Add New Umpire'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {isEdit ? 'Update umpire information' : 'Create a new umpire profile'}
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        /* Form */
        <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Photo */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <Label className="text-slate-900 dark:text-slate-300">Umpire Profile Photo</Label>
                <div className="mt-2">
                  <ImageUpload
                    value={profilePreview || undefined}
                    onChange={(file, preview) => setProfilePreview(preview)}
                    label=""
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form Fields */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-6 space-y-6">
                
                {/* Umpire Name */}
                <div>
                  <Label className="text-slate-900 dark:text-slate-300">Umpire Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                    placeholder="Enter umpire name"
                    required
                  />
                </div>

                {/* Date of Birth & Place of Birth */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-900 dark:text-slate-300">Date of Birth</Label>
                    <Input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-900 dark:text-slate-300">Place of Birth</Label>
                    <Input
                      value={formData.placeOfBirth}
                      onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                      className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      placeholder="Enter place of birth"
                    />
                  </div>
                </div>

                {/* Height */}
                <div>
                  <Label className="text-slate-900 dark:text-slate-300">Height</Label>
                  <Input
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                    placeholder="e.g., 5 ft 10 in or 178 cm"
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                {/* Number of Matches */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Match Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Test Matches</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.testMatches ?? ''}
                      onChange={(e) => setFormData({ ...formData, testMatches: e.target.value ? Number(e.target.value) : 0 })}
                      className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      placeholder="0"
                    />
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">ODI Matches</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.odiMatches ?? ''}
                      onChange={(e) => setFormData({ ...formData, odiMatches: e.target.value ? Number(e.target.value) : 0 })}
                      className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      placeholder="0"
                    />
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">T20 Matches</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.t20Matches ?? ''}
                      onChange={(e) => setFormData({ ...formData, t20Matches: e.target.value ? Number(e.target.value) : 0 })}
                      className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      placeholder="0"
                    />
                    </div>

                    <div>
                      <Label className="text-slate-900 dark:text-slate-300">Other Formats</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.otherMatches ?? ''}
                      onChange={(e) => setFormData({ ...formData, otherMatches: e.target.value ? Number(e.target.value) : 0 })}
                      className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      placeholder="0"
                    />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-slate-700"></div>

                {/* Career Start */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Career Information</h3>
                  <div>
                    <Label className="text-slate-900 dark:text-slate-300">Debut / Career Start</Label>
                    <Input
                      type="text"
                      value={formData.careerStart}
                      onChange={(e) => setFormData({ ...formData, careerStart: e.target.value })}
                      className="mt-1 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      placeholder="e.g., 2010 or January 2010"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                    {submitting ? 'Saving...' : (isEdit ? 'Update Umpire' : 'Save Umpire')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/umpires')}
                    className="border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
      )}
    </div>
  );
}
