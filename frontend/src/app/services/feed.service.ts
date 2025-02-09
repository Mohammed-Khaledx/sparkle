import { Injectable  ,inject} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private apiUrl = 'http://localhost:3000/posts'; // Change to your backend URL

  httpClient = inject(HttpClient);

  constructor() { }

  getFeed(page: number = 1, limit: number = 10): Observable<any> {

    return this.httpClient.get<any>(`${this.apiUrl}/feed?page=${page}&limit=${limit}` , { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
  }
 
}
