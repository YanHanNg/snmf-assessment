import { Injectable } from "@angular/core";
import { ReminderCameraImage } from './../model/model';

@Injectable()
export class CameraService {

	rImage: ReminderCameraImage  = null

	clear() {
		this.rImage = null
	}

	getImage(): ReminderCameraImage {
		return this.rImage
	}

	hasImage(): boolean {
		return (this.rImage != null)
	}

	clearImage() {
		this.rImage = null;
	}
}
