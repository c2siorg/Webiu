import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment, environment1 } from '../../environments/environment';

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface ChatHistory {
  role: 'user' | 'model';
  parts: { text: string }[];
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
  private chatHistory: ChatHistory[] = [];
  
  constructor(private http: HttpClient) {
    this.initializeAssistant();
  }

  private initializeAssistant() {
    const assistantContext = `
      You are a helpful AI assistant that can help with a wide range of topics.
      While you have knowledge about C2SI (Ceylon Computer Science Institute), you can also:
      - Answer general questions
      - Help with technical problems
      - Provide explanations on various topics
      - Assist with coding and development
      - Give advice and recommendations
      
      When answering:
      1. Provide clear, direct responses
      2. Use examples when helpful
      3. Admit if you're unsure about something
      4. Maintain a friendly, professional tone
    `;

    this.chatHistory = [{
      role: 'model',
      parts: [{ text: assistantContext }]
    }];
  }

  generateResponse(prompt: string): Observable<GeminiResponse> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    this.chatHistory.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const body = {
      contents: this.chatHistory.map(msg => ({
        role: msg.role,
        parts: msg.parts
      })),
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

    return this.http.post<GeminiResponse>(
      `${this.apiUrl}?key=${environment1.geminiApiKey}`,
      body,
      { headers }
    ).pipe(
      tap(response => {
        if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
          this.chatHistory.push({
            role: 'model',
            parts: [{ text: response.candidates[0].content.parts[0].text }]
          });
        }
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred. Please try again.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = 'Network error occurred. Please check your connection.';
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Authentication failed. Please contact support.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  clearHistory(): void {
    this.initializeAssistant();
  }

  getHistory(): ChatHistory[] {
    return this.chatHistory;
  }
}