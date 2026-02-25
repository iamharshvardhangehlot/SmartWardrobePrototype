from django import forms
from .models import UserProfile, Garment, FABRIC_CHOICES

# --- CUSTOM WIDGET TO ALLOW MULTIPLE UPLOADS ---
class MultipleFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True

class UserSetupForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        # 1. ADD 'full_body_image' TO THIS LIST
        fields = [
            'height_cm',
            'weight_kg',
            'skin_undertone',
            'selfie',
            'full_body_image',
            'city',
            'timezone',
        ]
        
        widgets = { 
            'skin_undertone': forms.RadioSelect(), 
            
            'height_cm': forms.NumberInput(attrs={
                'class': 'w-full p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 font-bold',
                'style': 'color: white !important; background-color: #374151 !important;' 
            }),
            'weight_kg': forms.NumberInput(attrs={
                'class': 'w-full p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 font-bold',
                'style': 'color: white !important; background-color: #374151 !important;'
            }),
            
            # 2. ENSURE BOTH INPUTS ARE HIDDEN (So our custom UI works)
            'selfie': forms.FileInput(attrs={'class': 'hidden', 'id': 'id_selfie'}), 
            'full_body_image': forms.FileInput(attrs={'class': 'hidden', 'id': 'id_full_body_image'}) 
            ,
            'city': forms.TextInput(attrs={
                'class': 'w-full p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 font-bold',
                'placeholder': 'e.g. San Francisco'
            }),
            'timezone': forms.TextInput(attrs={
                'class': 'w-full p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 font-bold',
                'placeholder': 'e.g. America/Los_Angeles'
            })
        }

class GarmentScanForm(forms.ModelForm):
    class Meta:
        model = Garment
        fields = ['image', 'purchase_price', 'fabric_type']
        widgets = {
            'purchase_price': forms.NumberInput(attrs={
                'class': 'w-full p-2 rounded text-black font-bold',
                'placeholder': 'e.g. 500'
            }),
            'image': forms.FileInput(attrs={
                'class': 'w-full p-2 text-white' 
            })
        }

    fabric_type = forms.ChoiceField(
        choices=[('', 'Select Fabric')] + list(FABRIC_CHOICES),
        required=True,
        widget=forms.Select(attrs={
            'class': 'w-full p-2 rounded text-black font-bold'
        })
    )


class BulkGarmentForm(forms.Form):
    # We REMOVED the 'images' field from here. 
    # We will handle it manually in the HTML to bypass validation errors.
    
    bulk_price = forms.DecimalField(
        max_digits=10, 
        decimal_places=2,
        widget=forms.NumberInput(attrs={
            'class': 'w-full p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 font-bold',
            'placeholder': 'Price for all items (e.g. 500)'
        }),
        label="Default Price (INR)"
    )

    fabric_type = forms.ChoiceField(
        choices=[('', 'Select Fabric')] + list(FABRIC_CHOICES),
        required=False,
        widget=forms.Select(attrs={
            'class': 'w-full p-4 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 font-bold',
        }),
        label="Default Fabric Type"
    )
