import io
import logging
import os

import replicate
from django.conf import settings
from PIL import Image

logger = logging.getLogger(__name__)


def _get_replicate_client():
    token = getattr(settings, "REPLICATE_API_TOKEN", None) or os.environ.get(
        "REPLICATE_API_TOKEN"
    )
    if not token:
        logger.warning("REPLICATE_API_TOKEN is not configured.")
        return None
    return replicate.Client(api_token=token)


def generate_tryon(
    human_image_input, garment_image_path, category="upper_body", description="clothing item"
):
    """
    1. Removes background from the user's photo.
    2. Composites the user onto a clean WHITE background.
    3. Sends the clean image to Replicate.
    """
    logger.info("Starting VTON (%s) for: %s", category, garment_image_path)

    client = _get_replicate_client()
    if not client:
        return None

    try:
        # ---------------------------------------------------------
        # STEP 1: PRE-PROCESS HUMAN IMAGE (Clean & White Background)
        # ---------------------------------------------------------
        logger.debug("Cleaning background for better detection.")

        # Load the image data
        if str(human_image_input).startswith("http"):
            human_input = human_image_input
        else:
            with open(human_image_input, "rb") as f:
                input_bytes = f.read()
            try:
                from rembg import remove
                subject_only = remove(input_bytes)

                img = Image.open(io.BytesIO(subject_only)).convert("RGBA")
                white_bg = Image.new("RGBA", img.size, "WHITE")
                white_bg.paste(img, (0, 0), img)
                final_image = white_bg.convert("RGB")

                buf = io.BytesIO()
                final_image.save(buf, format="JPEG", quality=95)
                human_input = buf
            except Exception:
                logger.warning("rembg unavailable; using original image for VTON.")
                human_input = io.BytesIO(input_bytes)

        # ---------------------------------------------------------
        # STEP 2: PREPARE GARMENT
        # ---------------------------------------------------------
        with open(garment_image_path, "rb") as garm_file:
            # ---------------------------------------------------------
            # STEP 3: RUN AI
            # ---------------------------------------------------------
            output = client.run(
                "cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
                input={
                    "human_img": human_input,
                    "garm_img": garm_file,
                    "garment_des": description,
                    "category": category,
                    "seed": 42,
                    "steps": 30,
                    "crop": False,
                },
            )

        # ---------------------------------------------------------
        # STEP 4: SAFE OUTPUT HANDLING
        # ---------------------------------------------------------
        if not output:
            logger.warning("AI returned nothing. (Pose still undetected)")
            return None

        if isinstance(output, list):
            if len(output) > 0:
                output_url = str(output[0])
            else:
                return None
        else:
            output_url = str(output)

        logger.info("%s complete. Result: %s", category, output_url)
        return output_url

    except Exception as exc:
        logger.exception("Error during VTON: %s", exc)
        return None
