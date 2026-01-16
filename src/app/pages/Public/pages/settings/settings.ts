import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from '../profile/service/profile';
import { AuthService } from '../../../Authentication/Service/auth';
import {
    UserProfileData, UpdateBasicProfileDto, AddEducationDto, UpdateEducationDto,
    AddPositionDto, UpdatePositionDto, Education, Position, SocialPlatform, SocialLinkDto
} from '../profile/models/profile';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    providers: [DatePipe],
    templateUrl: './settings.html',
    styleUrls: ['./settings.scss']
})
export class SettingsComponent implements OnInit {

    private profileService = inject(ProfileService);
    private authService = inject(AuthService);
    private fb = inject(FormBuilder);
    private cdr = inject(ChangeDetectorRef);
    private datePipe = inject(DatePipe);

    // Layout State
    activeTab: 'profile' | 'security' | 'tags' = 'profile';

    // Data State
    user: UserProfileData | null = null;
    isLoading = true;
    isSaving = false;

    // Forms
    basicForm!: FormGroup;
    eduForm!: FormGroup;
    posForm!: FormGroup;
    socialForm!: FormGroup;
    passwordForm!: FormGroup;

    // Edit State
    isEditMode = false;
    selectedItemId: number | null = null;

    modalState = { education: false, position: false, social: false, password: false };


    socialPlatforms = [
        { id: SocialPlatform.Facebook, name: 'Facebook', icon: 'bi-facebook' },
        { id: SocialPlatform.Twitter, name: 'Twitter', icon: 'bi-twitter-x' },
        { id: SocialPlatform.LinkedIn, name: 'LinkedIn', icon: 'bi-linkedin' },
        { id: SocialPlatform.Github, name: 'Github', icon: 'bi-github' },
        { id: SocialPlatform.Website, name: 'Website', icon: 'bi-globe' },
        { id: SocialPlatform.Other, name: 'Other', icon: 'bi-link-45deg' }
    ];

    ngOnInit() {
        this.initForms();
        this.loadCurrentUser();
    }

    initForms() {
        this.basicForm = this.fb.group({
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            headline: ['', [Validators.required, Validators.maxLength(100)]],
            bio: ['', [Validators.maxLength(500)]],
            locationId: [0]
        });

        this.eduForm = this.fb.group({
            school: ['', Validators.required],
            degree: ['', Validators.required],
            fieldOfStudy: ['', Validators.required],
            startDate: ['', Validators.required],
            endDate: ['']
        });

        this.posForm = this.fb.group({
            title: ['', Validators.required],
            company: ['', Validators.required],
            startDate: ['', Validators.required],
            endDate: [''],
            isCurrent: [false]
        });

        this.socialForm = this.fb.group({
            platform: [SocialPlatform.Website, Validators.required],
            url: ['', [Validators.required, Validators.pattern('https?://.+')]]
        });

        this.passwordForm = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        });
    }

    // ... (existing loadCurrentUser)

    // ... (existing saveBasicInfo)

    // ... (existing Education methods)

    // ... (existing Position methods)

    // ... (existing Social methods)


    // --- Security ---
    openChangePassword() {
        this.passwordForm.reset();
        this.modalState.password = true;
    }

    savePassword() {
        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        const val = this.passwordForm.value;
        if (val.newPassword !== val.confirmPassword) {
            alert('New passwords do not match!');
            return;
        }

        this.isSaving = true;
        // Simulate API call
        setTimeout(() => {
            this.isSaving = false;
            this.modalState.password = false;
            alert('Password changed successfully!');
        }, 1000);
    }

    // --- Helpers ---
    handleResponse(res: any, modalKey: keyof typeof this.modalState) {
        this.isSaving = false;
        if (res.isSuccess) {
            this.modalState[modalKey] = false;
            this.loadCurrentUser();
        }
    }

    closeModals() {
        Object.keys(this.modalState).forEach(key => this.modalState[key as keyof typeof this.modalState] = false);
    }

    loadCurrentUser() {
        this.isLoading = true;
        const currentUser = this.authService.currentUser$.value;
        if (!currentUser || !currentUser.username) {
            this.isLoading = false;
            return;
        }

        this.profileService.getProfile(currentUser.username).subscribe({
            next: (res) => {
                this.isLoading = false;
                if (res.isSuccess && res.data) {
                    this.user = res.data;
                    // Pre-fill basic form
                    this.basicForm.patchValue({
                        firstName: this.user.firstName,
                        lastName: this.user.lastName,
                        headline: this.user.headline,
                        bio: this.user.bio,
                        locationId: this.user.locationId || 1
                    });
                }
                this.cdr.detectChanges();
            },
            error: () => this.isLoading = false
        });
    }

    // --- Basic Info ---
    saveBasicInfo() {
        if (this.basicForm.invalid) {
            this.basicForm.markAllAsTouched();
            return;
        }
        this.isSaving = true;
        const dto: UpdateBasicProfileDto = {
            FirstName: this.basicForm.value.firstName,
            LastName: this.basicForm.value.lastName,
            Headline: this.basicForm.value.headline,
            Bio: this.basicForm.value.bio,
            LocationId: Number(this.basicForm.value.locationId)
        };

        this.profileService.updateBasicInfo(dto).subscribe({
            next: (res) => {
                this.isSaving = false;
                if (res.isSuccess) {
                    alert('Profile updated successfully!');
                    this.loadCurrentUser();
                }
            },
            error: () => this.isSaving = false
        });
    }

    // --- Education ---
    openAddEdu() { this.isEditMode = false; this.eduForm.reset(); this.modalState.education = true; }

    openEditEdu(edu: Education) {
        this.isEditMode = true;
        this.selectedItemId = edu.id;
        this.eduForm.patchValue({
            school: edu.school,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            startDate: this.formatDateForInput(edu.startDate),
            endDate: this.formatDateForInput(edu.endDate)
        });
        this.modalState.education = true;
    }

    saveEdu() {
        if (this.eduForm.invalid) return;
        this.isSaving = true;
        const val = this.eduForm.value;
        const dtoAdd: AddEducationDto = {
            School: val.school,
            Degree: val.degree,
            FieldOfStudy: val.fieldOfStudy,
            StartDate: new Date(val.startDate).toISOString(),
            EndDate: val.endDate ? new Date(val.endDate).toISOString() : undefined
        };

        const dtoUpdate: UpdateEducationDto = { EducationId: this.selectedItemId!, ...dtoAdd };

        if (this.isEditMode) {
            this.profileService.updateEducation(dtoUpdate).subscribe(res => this.handleResponse(res, 'education'));
        } else {
            this.profileService.addEducation(dtoAdd).subscribe(res => this.handleResponse(res, 'education'));
        }
    }

    deleteEdu(id: number) {
        if (confirm('Are you sure you want to delete this education entry?')) {
            this.profileService.deleteEducation(id).subscribe(() => this.loadCurrentUser());
        }
    }

    // --- Position ---
    openAddPos() { this.isEditMode = false; this.posForm.reset({ isCurrent: false }); this.modalState.position = true; }

    openEditPos(pos: Position) {
        this.isEditMode = true;
        this.selectedItemId = pos.id;
        this.posForm.patchValue({
            title: pos.title,
            company: pos.company,
            startDate: this.formatDateForInput(pos.startDate),
            endDate: this.formatDateForInput(pos.endDate),
            isCurrent: pos.isCurrent
        });
        this.modalState.position = true;
    }

    savePos() {
        if (this.posForm.invalid) return;
        this.isSaving = true;
        const val = this.posForm.value;
        const dtoAdd: AddPositionDto = {
            Title: val.title,
            Company: val.company,
            StartDate: new Date(val.startDate).toISOString(),
            EndDate: val.endDate ? new Date(val.endDate).toISOString() : undefined,
            IsCurrent: val.isCurrent
        };

        const dtoUpdate: UpdatePositionDto = { PositionId: this.selectedItemId!, ...dtoAdd };

        if (this.isEditMode) {
            this.profileService.updatePosition(dtoUpdate).subscribe(res => this.handleResponse(res, 'position'));
        } else {
            this.profileService.addPosition(dtoAdd).subscribe(res => this.handleResponse(res, 'position'));
        }
    }

    deletePos(id: number) {
        if (confirm('Are you sure you want to delete this experience entry?')) {
            this.profileService.deletePosition(id).subscribe(() => this.loadCurrentUser());
        }
    }

    // --- Social ---
    openAddSocial() { this.isEditMode = false; this.socialForm.reset({ platform: 0 }); this.modalState.social = true; }

    saveSocial() {
        if (this.socialForm.invalid) return;
        this.isSaving = true;
        const dto: SocialLinkDto = {
            LinkId: this.isEditMode ? this.selectedItemId! : 0,
            Platform: Number(this.socialForm.value.platform),
            Url: this.socialForm.value.url
        };

        if (this.isEditMode) {
            this.profileService.updateSocialLink(dto).subscribe(res => this.handleResponse(res, 'social'));
        } else {
            this.profileService.addSocialLink(dto).subscribe(res => this.handleResponse(res, 'social'));
        }
    }




    formatDateForInput(dateStr?: string): string {
        return dateStr ? (this.datePipe.transform(dateStr, 'yyyy-MM-dd') || '') : '';
    }

    getPlatformName(id: number): string { return this.socialPlatforms.find(p => p.id === id)?.name || 'Link'; }
    getPlatformIcon(id: number): string { return this.socialPlatforms.find(p => p.id === id)?.icon || 'bi-link'; }

    onAvatarSelected(event: any) {
        const file = event.target.files[0];
        if (file) this.profileService.uploadAvatar(file).subscribe(res => { if (res.isSuccess) this.loadCurrentUser(); });
    }

    onCoverSelected(event: any) {
        const file = event.target.files[0];
        if (file) this.profileService.uploadCover(file).subscribe(res => { if (res.isSuccess) this.loadCurrentUser(); });
    }

    // Security & Tags Placeholders
    saveSecurity() {
        alert('Security settings saved (Simulation)');
    }

    saveTags() {
        alert('Tags saved (Simulation)');
    }

}
