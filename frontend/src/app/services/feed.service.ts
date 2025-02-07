import { Injectable  ,inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private apiUrl = 'http://localhost:5000/api/posts'; // Change to your backend URL

  httpClient = inject(HttpClient);

  constructor() { }

  getFeed(): Observable<any> {
    return this.httpClient.get<any>(`${this.apiUrl}/feed` , { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
  }
}
